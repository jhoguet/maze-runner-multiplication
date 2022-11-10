import {
    Scene,
    FreeCamera,
    Vector3,
    Camera,
} from 'babylonjs';
import { MazeCanvasProvider } from '../MazeSceneFactory';

export class MazeFreeCameraFactory {
    static inject = () => [MazeCanvasProvider];
    constructor(private canvasProvider: MazeCanvasProvider) { }
    createAndAttachCamera = ({ scene }: { scene: Scene }): Camera => {
        const canvas = this.canvasProvider.getCanvas();

        // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
        const camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
        // Target the camera to scene origin
        camera.setTarget(Vector3.Zero());
        // Attach the camera to the canvas
        camera.attachControl(canvas, false);

        return camera;
    }
}
