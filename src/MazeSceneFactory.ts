import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Texture,
    Tools,
    ExecuteCodeAction,
    ActionManager,
    Color3
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer'; 
import '@babylonjs/inspector'
import { Rectangle, AdvancedDynamicTexture, TextBlock, Control } from '@babylonjs/gui/2D';

import { MazeUniversalCameraFactory } from './cameras/MazeUniversalCameraFactory';

var randomNumber = function (min: number, max: number) {
    if (min === max) {
        return (min);
    }
    var random = Math.random();
    return ((random * (max - min)) + min);
};

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

    startScene = (): void => {
        const canvas = this.canvasProvider.getCanvas();
        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        // Create a basic BJS Scene object
        const scene = new Scene(engine);
        // scene.debugLayer.show({  })
        (window as any).scene = scene;

        const camera = this.cameraFactory.createAndAttachCamera({ scene });

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
            centerX: -2,
            centerY: -30,
            width: 46,
            height: wallHeight,
            rotationDegrees: 0,
            scene
        });

        this.createGap({
            height: wallHeight,
            canadate: 10, 
            width: 5, 
            center: new Vector3(-2.5, wallHeight / 2, 10),
            scene
        });

        this.createGap({
            height: wallHeight,
            canadate: 0, 
            width: 5, 
            center: new Vector3(4.5, wallHeight / 2, 10),
            scene
        });

        this.createGap({
            height: wallHeight,
            canadate: 6, 
            width: 5, 
            center: new Vector3(-9.5, wallHeight / 2, 10),
            scene
        });

        this.createGap({
            height: wallHeight,
            canadate: 2, 
            width: 5, 
            center: new Vector3(-16.5, wallHeight / 2, 10),
            scene
        });
        this.createGap({
            height: wallHeight,
            canadate: 15, 
            width: 5, 
            center: new Vector3(11.5, wallHeight / 2, 10),
            scene
        });

        //scene.debugLayer.show()
        
        

        camera.onCollide = mesh => {
            if (mesh.name === 'gap'){
                camera.position = new Vector3(0, 5, -28);
            }
        }

        ground.material = groundMaterial
        const texture = new Texture('https://www.babylonjs-playground.com/textures/floor.png')
        groundMaterial.diffuseTexture = texture
        texture.uScale = groundSize / 10
        texture.vScale = groundSize / 10

        let number1 = Math.round(randomNumber(1, 12))
        let number2 = Math.round(randomNumber(1, 12))
        let answer = number1 * number2


        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('gui');

        

        // gui test
        const rect = new Rectangle();
        const text = new TextBlock("text",String(number1) + " x " + String(number2));
        rect.width = .2;
        rect.height = '40px';
        rect.cornerRadius = 20;
        rect.thickness = 4;
        rect.background = 'green';
        rect.addControl(text)
        advancedTexture.addControl(rect);
        rect.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP

        // Return the created scene
        engine.runRenderLoop(function () {
            scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener('resize', function () {
            engine.resize();
        });
    }

    private createGap =(params:{height: number, width: number, center: Vector3, scene:Scene, canadate: number}) => {
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
        const gapText = new TextBlock("text1", String(params.canadate));
        gapRect.width = .4;
        gapRect.height = '60px';
        gapRect.cornerRadius = 20;
        gapRect.thickness = 4;
        gapRect.background = 'green';
        gapRect.fontSize = '50px'
        gapRect.addControl(gapText);
        gapTexture.addControl(gapRect);
    }

    private createWall = ({ centerX, centerY, width, height, scene, rotationDegrees }: { centerX: number, centerY: number, width: number, height: number, scene: Scene, rotationDegrees: number }) => {
        var box = MeshBuilder.CreateBox("crate", { size: 2, height, depth: .5, width }, scene);
        box.rotation.y = Tools.ToRadians(rotationDegrees);
        const boxMaterial = new StandardMaterial("Mat", scene);
        box.material = boxMaterial
        boxMaterial.diffuseTexture = new Texture("https://www.babylonjs-playground.com/textures/crate.png", scene);
        box.checkCollisions = true;

        //

        box.position = new Vector3(centerX, height / 2, centerY);

    }
}