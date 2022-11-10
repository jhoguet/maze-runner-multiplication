import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from 'babylonjs';


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
    static inject = () => [MazeCanvasProvider];
    constructor(private canvasProvider: MazeCanvasProvider){}

    startScene = (): void => {
        const canvas = this.canvasProvider.getCanvas();
        const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        // Create a basic BJS Scene object
        const scene = new Scene(engine);
        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
        // Target the camera to scene origin
        camera.setTarget(Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);
        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
        // Create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        const sphere = MeshBuilder.CreateSphere('sphere1', { segments: 16, diameter: 2, sideOrientation: Mesh.FRONTSIDE }, scene);
        // Move the sphere upward 1/2 of its height
        sphere.position.y = 1;
        // Create a built-in "ground" shape; its constructor takes 6 params : name, width, height, subdivision, scene, updatable
        MeshBuilder.CreateGround('ground1', { width: 25, height: 25, subdivisions: 2 }, scene);
        // Return the created scene
        engine.runRenderLoop(function () {
            scene.render();
        });
        // the canvas/window resize event handler
        window.addEventListener('resize', function () {
            engine.resize();
        });
    }
}