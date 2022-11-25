import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Texture,
    Tools,
    Sound,
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector'
import { Rectangle, AdvancedDynamicTexture, TextBlock, Control, Grid, Button } from '@babylonjs/gui/2D';
import { State } from '@symbiotic/green-state';
import moment from 'moment';

import { MazeUniversalCameraFactory } from './cameras/MazeUniversalCameraFactory';
import { GUI3DManager } from '@babylonjs/gui';

const startPosition = new Vector3(0, 5, -28);

const multiplesPerLevel = {
    '1': [0, 1, 2, 5, 10],
    '2': [0, 1, 2, 3, 4, 5, 10],
    '3': [1, 2, 3, 4, 5, 6, 7, 10],
    '4': [2, 3, 4, 5, 6, 7, 8, 9, 10],
    '5': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    '6': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

interface IRecord {
    asOf: string;
    level: number;
    correctCount: number
};
class LeaderBoard {
    saveAndShow = (record: IRecord) => {
        console.log('showed');
        const recordsRaw = window.localStorage.getItem('leader-board');
        const records: IRecord[] = recordsRaw ? JSON.parse(recordsRaw): [];
        records.push(record);
        window.localStorage.setItem('leader-board', JSON.stringify(records));
        const gui = AdvancedDynamicTexture.CreateFullscreenUI('gui');
        const stats = new Rectangle();
        gui.addControl(stats);
        stats.width = '700px';
        stats.height = '900px';
        stats.cornerRadius = 10;
        stats.thickness = 1;
        stats.background = 'gray';
        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        stats.paddingTop = '10px';
        stats.paddingRight = '10px';
        const grid = new Grid();
        grid.addColumnDefinition(.1)
        grid.addColumnDefinition(.3)
        grid.addColumnDefinition(.3)
        grid.addColumnDefinition(.3)
        for (let i = 0; i <= 11; i++){
            grid.addRowDefinition(.08);
        }
        grid.addControl(new TextBlock('', 'Level'), 0, 2);
        grid.addControl(new TextBlock('', 'Correct'), 0, 3);
        const sorted = records.sort((a, b) => {
            return (b.level * 100 + b.correctCount) - (a.level * 100  + a.correctCount);
        });

        const top10 = sorted.slice(0,9);

        for (let i = 0; i < top10.length; i++){
            const rank = new TextBlock('', String(i + 1));
            if (top10[i].asOf === record.asOf){
                rank.text += ' <=='
            }
            grid.addControl(rank, i + 1, 0);
            grid.addControl(new TextBlock('', moment(top10[i].asOf).format('MMM D hh:mm: a')), i + 1, 1);
            grid.addControl(new TextBlock('', String(top10[i].level)), i + 1, 2);
            grid.addControl(new TextBlock('', String(top10[i].correctCount)), i + 1, 3);
        }
        if (!top10.find(r => r.asOf === record.asOf)){
            const index = sorted.indexOf(sorted.find(r => r.asOf === record.asOf)!);
            const rowIndex = 11;
            grid.addControl(new TextBlock('', `${index + 1} <==`), rowIndex, 0);
            grid.addControl(new TextBlock('', moment(record.asOf).format('MMM D hh:mm: a')), rowIndex, 1);
            grid.addControl(new TextBlock('', String(record.level)), rowIndex, 2);
            grid.addControl(new TextBlock('', String(record.correctCount)), rowIndex, 3);
        }

        stats.addControl(grid);

        const button = Button.CreateSimpleButton("play-again", "Play Again");
        button.widthInPixels = 200;
        button.heightInPixels = 200;
        button.cornerRadius = 20;
        button.thickness = 4;
        button.background = 'green';
        button.fontSize = '70px';
        stats.addControl(button);
        button.onPointerClickObservable.add(()=>{
            console.log('removing');
            gui.removeControl(stats);
            (window as any).gameState.start();
        });
    }
}

class GameState extends State<{
    started: boolean,
    ended: boolean,
    level: number,
    correctCount: number,
    elapsedMS?: number;
    incorrectCount: number,
    startedAt?: number,
    problem?: { left: number, right: number, answer: number, options: number[], startedAt: number }
    levelStats: { level: number, correctCount: number, incorrect: { left: number, right: number }[], startedAt: number, completedAt?: number }[]
}> {
    constructor({ totalTimeMS }: { totalTimeMS: number }) {
        super({ level: 1, correctCount: 0, incorrectCount: 0, started: false, ended: false, levelStats: [] });
        this.totalTimeMS = totalTimeMS;
    }

    private totalTimeMS: number;

    getSecondsElapsed = () => {
        return (Date.now() - this.state.problem!.startedAt) / 1000;
    }

    getTotalSecondsElapsed = () => {
        return (Date.now() - this.state.startedAt!) / 1000;
    }

    getQuestionsRemaining = () => {
        const requiredCorrectN = this.getMultiples().length * 4;
        return requiredCorrectN - this.state.correctCount;
    }

    getPercentComplete = () => {
        // TODO: DRY RequiredCount
        return this.state.correctCount / (this.getMultiples().length * 4);
    }

    getTotalSecondsRemaining = () => {
        const msElapsed = Date.now() - this.state.startedAt!;
        const msRemaining = this.totalTimeMS - msElapsed;
        return msRemaining / 1000;
    }

    start = () => {
        const startedAt = Date.now();
        this.setState({
            startedAt,
            started: true,
            ended: false,
            level: 1,
            correctCount: 0,
            incorrectCount: 0,
            problem: undefined,
            elapsedMS: undefined,
            levelStats: [{
                level: 1,
                startedAt,
                correctCount: 0,
                incorrect: []
            }]
        });
        this.nextProblem();

        setTimeout(() => {
            this.end();
        }, this.totalTimeMS)
    }

    private end = () => {
        this.setState({ ended: true, problem: undefined });
    }

    private nextProblem = () => {
        const multiples = this.getMultiples();
        const leftIndex = Math.floor(Math.random() * multiples.length);
        const rightIndex = Math.floor(Math.random() * multiples.length);
        const left = multiples[leftIndex];
        const right = multiples[rightIndex];
        const answer = left * right;
        const options = this.getOptions(answer);

        let elapsedMS = 0
        if (this.state.problem){
            const problemElapsedMS = Date.now() - this.state.problem!.startedAt;
            const levelElapsedMS = this.state.elapsedMS || 0;
            elapsedMS = levelElapsedMS + problemElapsedMS;
        }

        this.setState({
            problem: {
                left,
                right,
                answer,
                options: [answer, ...options].sort(() => Math.random() - .5),
                startedAt: Date.now()
            },
            elapsedMS
        });
    }

    private getOptions = (answer: number): number[] => {
        const options: number[] = [];

        while (options.length <= 3){
            // random number from -10 to +10
            const offset = Math.floor(Math.random() * 20) - 10;
            let candidate = answer + offset;
            if (candidate < 0){
                candidate = 0;
            }
            if (![...options, answer].includes(candidate)){
                options.push(candidate);
            }
        }
        return options;
    }

    attemptAnswer = (answer: number) => {
        const isCorrect = this.state.problem!.answer === answer;
        const levelStats = this.state.levelStats.find(s => s.level === this.state.level);
        if (isCorrect){
            levelStats!.correctCount++;
            this.setState({
                correctCount: this.state.correctCount + 1,
            });
        }
        else {
            levelStats!.incorrect.push({
                left: this.state.problem!.left,
                right: this.state.problem!.right
            });
            this.setState({
                incorrectCount: this.state.incorrectCount + 1
            });
        }
        this.checkExperience();

        this.nextProblem();

        return isCorrect;
    }

    checkExperience = () => {
        if (this.getQuestionsRemaining() <= 0){
            this.advance();
        }
    }

    getMultiples = (): number[] => {
        return (multiplesPerLevel as any)[String(this.state.level)];
    }

    advance = () => {
        const level = this.state.level;

        this.state.levelStats.push({
            level: level + 1,
            correctCount: 0,
            incorrect: [],
            startedAt: Date.now()
        });

        if (level < 6){
            this.setState({
                level: level + 1,
                correctCount: 0,
                incorrectCount: 0
            });
        }
    }
}
const gameState = (window as any).gameState = new GameState({ totalTimeMS: 2 * 60 * 1000 });

export class MazeCanvasProvider {
    setCanvas = (canvas: HTMLCanvasElement) => {
        this.canvas = canvas;
    }
    getCanvas = (): HTMLCanvasElement => {
        return this.canvas!;
    }
    private canvas?: HTMLCanvasElement;
}

export class MazeSceneFactory {
    static inject = () => [MazeCanvasProvider, MazeUniversalCameraFactory];
    constructor(private canvasProvider: MazeCanvasProvider, private cameraFactory: MazeUniversalCameraFactory) { }

    private started = false;

    startScene = (): void => {
        if (this.started){
            return;
        }

        this.started = true;

        const canvas = this.canvasProvider.getCanvas();
        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        // Create a basic BJS Scene object
        const scene = new Scene(engine);

        const ambient = new Sound('ambient', './ambient.mp3', scene, null, { loop: true, autoplay: false });

        const wrongSound = new Sound('wrong', './wrong.mp3', scene, null, { loop: false, autoplay: false });
        const correctSound = new Sound('correct', './correct.mp3', scene, null, { loop: false, autoplay: false });
        // TODO: tie this to the play button
        Engine.audioEngine!.useCustomUnlockedButton = true;

        // BABYLON.Engine.audioEngine.useCustomUnlockedButton = true;
        // BABYLON.Engine.audioEngine.unlock();

        // scene.debugLayer.show({  })
        (window as any).scene = scene;

        const camera = this.cameraFactory.createAndAttachCamera({ scene });
        camera.position = startPosition.clone();
        const gapHeight = 15

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        // const sphere = MeshBuilder.CreateSphere('sphere1', { segments: 16, diameter: 2, sideOrientation: Mesh.FRONTSIDE }, scene);
        // sphere.checkCollisions = true
        // Move the sphere upward 1/2 of its height
        // sphere.position.y = 1;
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        const groundSize = 100;
        const ground = MeshBuilder.CreateGround('ground1', { width: groundSize, height: groundSize, subdivisions: 2 }, scene);
        ground.checkCollisions = true;

        const groundMaterial = new StandardMaterial('groundMaterial');
        ground.material = groundMaterial;
        groundMaterial.diffuseTexture = new Texture('https://www.babylonjs-playground.com/textures/floor.png', scene);


        const wallHeight = 15;
        // Create a wall
        const fakeWall = this.createWall({
            centerX: -2,
            centerY: 9,
            width: 40,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: 1,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: 8,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: -6,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: -13,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: -20,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: 15,
            centerY: 10,
            width: 2,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: 16,
            centerY: -10,
            width: 40,
            height: wallHeight,
            rotationDegrees: 90,
            scene
        });

        this.createWall({
            centerX: -21,
            centerY: -10,
            width: 40,
            height: wallHeight,
            rotationDegrees: 90,
            scene
        });

        this.createWall({
            centerX: 17,
            centerY: 30,
            width: 40,
            height: wallHeight,
            rotationDegrees: 90,
            scene
        });

        this.createWall({
            centerX: -21,
            centerY: 30,
            width: 40,
            height: wallHeight,
            rotationDegrees: 90,
            scene
        });

        this.createWall({
            centerX: -2,
            centerY: -30,
            width: 46,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: -2,
            centerY: 50,
            width: 40,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createWall({
            centerX: -2,
            centerY: 50,
            width: 40,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createGap({
            height: gapHeight,
            candidateIndex: 0,
            width: 5,
            center: new Vector3(-2.5, gapHeight / 2, 10),
            scene
        });

        this.createGap({
            height: gapHeight,
            candidateIndex: 1,
            width: 5,
            center: new Vector3(4.5, gapHeight / 2, 10),
            scene
        });

        this.createGap({
            height: gapHeight,
            candidateIndex: 2,
            width: 5,
            center: new Vector3(-9.5, gapHeight / 2, 10),
            scene
        });

        this.createGap({
            height: gapHeight,
            candidateIndex: 3,
            width: 5,
            center: new Vector3(-16.5, gapHeight / 2, 10),
            scene
        });
        this.createGap({
            height: gapHeight,
            candidateIndex: 4,
            width: 5,
            center: new Vector3(11.5, gapHeight / 2, 10),
            scene
        });

        //scene.debugLayer.show()
        let ignoreGapCollision = false;

        camera.onCollide = mesh => {
            if (!ignoreGapCollision && mesh.name === 'gap') {
                ignoreGapCollision = true;

                const parsed = JSON.parse(mesh.state);
                const candidate = Number(parsed.candidate);
                const isCorrect = gameState.attemptAnswer(candidate);

                if (!isCorrect){
                    wrongSound.play();
                } else {
                    correctSound.play();
                }

                setTimeout(() => {
                    ignoreGapCollision = false;
                }, 500);
                camera.position = startPosition.clone();
            }
        }

        ground.material = groundMaterial
        const texture = new Texture('https://www.babylonjs-playground.com/textures/floor.png')
        groundMaterial.diffuseTexture = texture
        texture.uScale = groundSize / 10
        texture.vScale = groundSize / 10

        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('gui');

        // prog bar
        let progBarWidth = (250 / 2 - 2) * 1;
        const progBar = new Rectangle()
        progBar.widthInPixels = 250 / 2;
        progBar.heightInPixels = 25; 
        progBar.verticalAlignment = 1;
        progBar.topInPixels = -577 ;
        progBar.leftInPixels = 525;
        progBar.zIndex = 10;
        progBar.background = "black";
        advancedTexture.addControl( progBar );

        const progBarInner = new Rectangle();
        progBarInner.widthInPixels = progBarWidth; // 250 / 2 - 2
        progBarInner.heightInPixels = 23; // progressBar.height - (progressBar.thickness *2 )
        progBarInner.thickness = 0;
        progBarInner.horizontalAlignment = 0;
        progBarInner.isVisible = true;
        progBarInner.topInPixels = -296 + 23;
        progBarInner.leftInPixels = 1095;
        progBarInner.zIndex = 11;
        progBarInner.background = "green";
        advancedTexture.addControl( progBarInner );
        progBarInner.isVisible = true;

        gameState.subscribe(() => {
            // if not started, then not visible
            // if  not started, don't call getPercentComplete
            // can see progress and problem at same time
            if (gameState.state.started === true) {
                progBarInner.widthInPixels = (250 / 2 - 2) * gameState.getPercentComplete()
                progBar.isVisible = true;
                progBarInner.isVisible = true;
            } else {
                progBar.isVisible = false;
                progBarInner.isVisible = false;
            }
            

            // }
        })

        // gui test
        const button = Button.CreateSimpleButton("button1", "PLAY");
        button.widthInPixels = 200;
        button.heightInPixels = 200;
        button.cornerRadius = 20;
        button.thickness = 4;
        button.background = 'green';
        button.fontSize = '70px';
        button.onPointerClickObservable.add(()=>{
            gameState.start();
            button.isVisible = false;
            Engine.audioEngine!.unlock();
            ambient.play();
            scene.removeMesh(fakeWall);
        });
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.paddingBottomInPixels = 100;
        advancedTexture.addControl(button)

        gameState.subscribe(() => {
            button.isVisible = !gameState.state.started;
        });

        const rect = new Rectangle();
        gameState.subscribe(() => {
            rect.isVisible = Boolean(gameState.state.problem);
        });
        const text = new TextBlock("text", '');
        rect.width = .2;
        rect.height = '60px';
        rect.cornerRadius = 20;
        rect.thickness = 4;
        rect.background = 'green';
        rect.fontSize = '50px';
        rect.addControl(text)
        rect.paddingTopInPixels = 10;
        rect.topInPixels = 100;
        advancedTexture.addControl(rect);
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        gameState.subscribe(() => {
            if (gameState.state.problem){
                text.text = `${gameState.state.problem.left} x ${gameState.state.problem.right}`;
            }
        });

        const stats = this.createGameStats();
        advancedTexture.addControl(stats);


        advancedTexture.addControl(this.createEndGameStats());
        // Return the created scene
        engine.runRenderLoop(function () {
            scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener('resize', function () {
            engine.resize();
        });
    }

    private createGap =(params:{height: number, width: number, center: Vector3, scene:Scene, candidateIndex: number}) => {
        const gap = MeshBuilder.CreatePlane("gap", { size: 2, height: params.height, width: params.width}, params.scene);
        gap.rotation.y = Tools.ToRadians(0);
        const boxMaterial = new StandardMaterial("Mat", params.scene);
        //boxMaterial.diffuseColor = Color3.Blue();
        gap.material = boxMaterial

        gameState.subscribe(() => {
            gap.isVisible = Boolean(gameState.state.problem);
        });

        boxMaterial.alpha = 0;
        gap.checkCollisions = true;

        gap.position = params.center
        const gapTexture = AdvancedDynamicTexture.CreateForMesh(gap);


        const gapRect = new Rectangle();
        const gapText = new TextBlock("text1", '');
        gapRect.widthInPixels = 200;
        gapRect.heightInPixels = 200;
        gapRect.cornerRadius = 20;
        gapRect.thickness = 4;
        gapRect.background = 'green';
        gapRect.fontSize = '70px'
        gapRect.addControl(gapText);
        gapRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        gapRect.paddingBottomInPixels = 100;
        gapTexture.addControl(gapRect);

        gameState.subscribe(() => {
            if (gameState.state.problem){
                const candidate = gameState.state.problem.options[params.candidateIndex];
                gapText.text = String(candidate);
                gap.state = JSON.stringify({ jon: 'was here', candidate });
            }
        });
    }

    private createGameStats = (): Rectangle => {
        const gameState = ((window as any).gameState as GameState);

        const stats = new Rectangle();
        stats.width = '300px';
        stats.height = '150px';
        stats.cornerRadius = 10;
        stats.thickness = 1;
        stats.background = 'gray';
        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        stats.paddingTop = '10px';
        stats.paddingRight = '10px';
        const grid = new Grid();
        stats.addControl(grid)

        gameState.subscribe(() => {
            stats.isVisible = Boolean(gameState.state.problem);
        });

        grid.addColumnDefinition(300, true);

        grid.addRowDefinition(60, true)
        const level = new TextBlock('level', 'Level 1');
        grid.addControl(level, 0, 0);

        grid.addRowDefinition(0, true)
        const multiples = new TextBlock('multiples', '1, 2, 5, 10');
        grid.addControl(multiples, 1, 0);

        const questionsRemaining = new TextBlock('questions-remaining', '');

        grid.addRowDefinition(60, true)
        const totalTime = new TextBlock('total-time', '');
        grid.addControl(totalTime, 4, 0);

        setInterval(()=>{
            if (gameState.state.problem){
                totalTime.text = `Remaining time (${Math.round(gameState.getTotalSecondsRemaining())})`;
                questionsRemaining.text = `${gameState.getQuestionsRemaining()} remaining`;
            }
        }, 250);

        gameState.subscribe(() => {
            if(gameState.state.problem){
                level.text = `Level ${gameState.state.level} ${gameState.getQuestionsRemaining()} remaining`;
                multiples.text = gameState.getMultiples().join(', ');
                if ((gameState.state.correctCount + gameState.state.incorrectCount) > 0){

                } else {

                }

                if (gameState.state.elapsedMS){

                }

            }
        });
        return stats;
    }

    private createEndGameStats = (): Rectangle => {

        const stats = new Rectangle();
        stats.width = '600px';
        stats.height = '800px';
        stats.cornerRadius = 10;
        stats.thickness = 1;
        stats.background = 'gray';
        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        stats.paddingTop = '10px';
        stats.paddingRight = '10px';
        const grid = new Grid();
        stats.addControl(grid);

        const button = Button.CreateSimpleButton("leaderboard", "Leaderboard");
        button.widthInPixels = 200;
        button.heightInPixels = 100;
        button.cornerRadius = 20;
        button.thickness = 4;
        button.background = 'green';
        button.fontSize = '30px';

        button.onPointerClickObservable.add(()=>{
            button.isEnabled = false;
            new LeaderBoard().saveAndShow({ asOf: new Date().toISOString(), level: gameState.state.level, correctCount: gameState.state.correctCount });
        });

        stats.addControl(button);

        // grid.adaptHeightToChildren = true;

        // grid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        gameState.subscribe(() => {
            stats.isVisible = Boolean(gameState.state.ended);
        });

        grid.addColumnDefinition(300, true);

        gameState.subscribe(() =>{
            for (const control of grid.getDescendants()){
                control.dispose();
            }
            let row = 0;
            for (const stats of gameState.state.levelStats){
                // TODO: I don't think we're clearing row definition, so we just keep adding them
                grid.addRowDefinition(60, true)
                grid.addControl(new TextBlock('', `Level ${stats.level} ${stats.completedAt ? 'completed in ' + Math.round((stats.completedAt - stats.startedAt) / 1000) + ' seconds' : 'incomplete'}`), row, 0);
                row++;
                grid.addRowDefinition(60, true)
                // TODO: what if zero (then don't display that level)
                grid.addControl(new TextBlock('', `${stats.incorrect.length} wrong (${Math.round(stats.correctCount / (stats.correctCount + stats.incorrect.length) * 100)}% accuracy)`), row, 0);
                row++;
                if (!stats.completedAt){
                    for (const { left, right } of stats.incorrect.slice(0, 3)){
                        grid.addRowDefinition(60, true)
                        grid.addControl(new TextBlock('', `${left} x ${right} = ${left * right}`), row, 0);
                        row++;
                    }
                }
                // top scores...
            }
        })

        return stats;
    }

    private createWall = ({ centerX, centerY, width, height, scene, rotationDegrees }: { centerX: number, centerY: number, width: number, height: number, scene: Scene, rotationDegrees: number }) => {
        var box = MeshBuilder.CreateBox("crate", { size: 2, height, depth: .5, width }, scene);
        box.rotation.y = Tools.ToRadians(rotationDegrees);
        const boxMaterial = new StandardMaterial("Mat", scene);
        box.material = boxMaterial
        boxMaterial.diffuseTexture = new Texture("https://www.babylonjs-playground.com/textures/crate.png", scene);
        box.checkCollisions = true;

        box.position = new Vector3(centerX, height / 2, centerY);
        return box;
    }
}