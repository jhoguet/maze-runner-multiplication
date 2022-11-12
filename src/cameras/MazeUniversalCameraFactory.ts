import {
    Scene,
    Vector3,
    UniversalCamera,
} from 'babylonjs';
import { MazeCanvasProvider } from '../MazeSceneFactory';
import { FreeCameraKeyboardWalkInput } from './FreeCameraKeyboardWalkInput';
import { FreeCameraSearchInput } from './FreeCameraSearchInput';

export class MazeUniversalCameraFactory {
    static inject = () => [MazeCanvasProvider];
    constructor(private canvasProvider: MazeCanvasProvider) { }
    createAndAttachCamera = ({ scene }: { scene: Scene }): void => {
        const canvas = this.canvasProvider.getCanvas();

        var camera = new UniversalCamera("camera1", new Vector3(0, 5, -10), scene);
        camera.checkCollisions = true
        camera.applyGravity = true

        camera.minZ = 0.0001;
        camera.attachControl(canvas, true);
        camera.speed = 0.02;
        (camera as any).angularSpeed = 0.05;
        (camera as any).angle = Math.PI/2;
        (camera as any).direction = new BABYLON.Vector3(Math.cos((camera as any).angle), 0, Math.sin((camera as any).angle));

        camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
        camera.inputs.removeByType("FreeCameraMouseInput");

        camera.inputs.add(new FreeCameraSearchInput())
        camera.inputs.add(new FreeCameraKeyboardWalkInput())
    }
}
