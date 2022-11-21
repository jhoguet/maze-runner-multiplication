import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Texture,
    Tools,
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer';
import '@babylonjs/inspector'
import { Rectangle, AdvancedDynamicTexture, TextBlock, Control, Grid } from '@babylonjs/gui/2D';
import { State } from '@symbiotic/green-state';

import { MazeUniversalCameraFactory } from './cameras/MazeUniversalCameraFactory';

const startPosition = new Vector3(0, 5, -28);

const multiplesPerLevel = {
    '1': [1, 2, 5, 10],
    '2': [1, 2, 3, 4, 5, 10],
    '3': [1, 2, 3, 4, 5, 6, 7, 10],
    '4': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    '5': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    '6': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

class GameState extends State<{ level: number, correctCount: number, incorrectCount: number, problem?: { left: number, right: number, answer: number, options: number[] } }> {
    constructor() {
        super({ level: 1, correctCount: 0, incorrectCount: 0 });

        this.nextProblem();
    }

    private nextProblem = () => {
        const multiples = this.getMultiples();
        const leftIndex = Math.floor(Math.random() * multiples.length);
        const rightIndex = Math.floor(Math.random() * multiples.length);
        const left = multiples[leftIndex];
        const right = multiples[rightIndex];
        const answer = left * right;
        const options = this.getOptions(answer);

        this.setState({
            problem: {
                left,
                right,
                answer,
                options: [answer, ...options].sort(() => Math.random() - .5)
            }
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
        if (isCorrect){
            this.setState({
                correctCount: this.state.correctCount + 1
            });
        }
        else {
            this.setState({
                incorrectCount: this.state.incorrectCount + 1
            });
        }
        this.checkExperience();

        this.nextProblem();

        return isCorrect;
    }

    checkExperience = () => {
        const n = this.state.incorrectCount + this.state.correctCount;
        const accuracy = this.state.correctCount / n;
        if (n >= this.getMultiples().length * 4 && accuracy >= .98){
            this.advance();
        }
    }

    getMultiples = (): number[] => {
        return (multiplesPerLevel as any)[String(this.state.level)];
    }

    advance = () => {
        const level = this.state.level;
        if (level < 6){
            this.setState({
                level: level + 1,
                correctCount: 0,
                incorrectCount: 0
            });
        }
    }
}
const gameState = (window as any).gameState = new GameState();

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
                gameState.attemptAnswer(candidate);

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



        // gui test
        const rect = new Rectangle();
        const text = new TextBlock("text", '');
        rect.width = .2;
        rect.height = '60px';
        rect.cornerRadius = 20;
        rect.thickness = 4;
        rect.background = 'green';
        rect.fontSize = '50px';
        rect.addControl(text)
        rect.paddingTopInPixels = 10;
        advancedTexture.addControl(rect);
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        gameState.subscribe(() => {
            text.text = `${gameState.state.problem!.left} x ${gameState.state.problem!.right}`;
        });

        const stats = this.createGameStats();
        advancedTexture.addControl(stats);

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
            const candidate = gameState.state.problem!.options[params.candidateIndex];
            gapText.text = String(candidate);
            gap.state = JSON.stringify({ jon: 'was here', candidate });
            // console.log(gap.state);
        });
    }

    private createGameStats = (): Rectangle => {
        const stats = new Rectangle();
        stats.width = '400px';
        stats.height = '200px';
        stats.cornerRadius = 10;
        stats.thickness = 1;
        stats.background = 'gray';
        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        stats.paddingTop = '10px';
        stats.paddingRight = '10px';
        const grid = new Grid();
        stats.addControl(grid)

        grid.addColumnDefinition(300, true);

        grid.addRowDefinition(60, true)
        const level = new TextBlock('level', 'Level 1');
        grid.addControl(level, 0, 0);

        grid.addRowDefinition(0, true)
        const multiples = new TextBlock('multiples', '1, 2, 5, 10');
        grid.addControl(multiples, 1, 0);

        grid.addRowDefinition(60, true)
        const accuracy = new TextBlock('accuracy', 'Accuracy: 100%');
        grid.addControl(accuracy, 2, 0);

        // grid.addRowDefinition(60, true)
        // const speed = new TextBlock('speed', '10 problems per minute');
        // grid.addControl(speed, 3, 0);

        grid.addRowDefinition(0, true)
        const problem = new TextBlock('problem', '');
        grid.addControl(problem, 4, 0);

        const gameState = ((window as any).gameState as GameState);
        gameState.subscribe(() => {
            level.text = `Level ${gameState.state.level}`;
            multiples.text = gameState.getMultiples().join(', ');
            problem.text = `${gameState.state.problem!.left} x ${gameState.state.problem!.right}`;
            if ((gameState.state.correctCount + gameState.state.incorrectCount) > 0){
                console.log(gameState.state);
                accuracy.text = `${Math.round(gameState.state.correctCount / (gameState.state.correctCount + gameState.state.incorrectCount) * 100)}% right (${gameState.state.correctCount + gameState.state.incorrectCount})`
            } else {
                accuracy.text = '';
            }
        });
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
    }
}