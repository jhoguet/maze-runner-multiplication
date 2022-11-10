import { FreeCamera, ICameraInput } from 'babylonjs';
import { Nullable } from 'babylonjs/index';

export class FreeCameraKeyboardWalkInput implements ICameraInput<FreeCamera>{
    constructor() {
        this._keys = [];
        this.keysUp = [38, 87];
        this.keysDown = [40, 83];
        this.keysLeft = [37, 65];
        this.keysRight = [39, 68];
    }
    camera: Nullable<FreeCamera> = null;
    private _keys: number[] = [];
    private keysLeft: number[];
    private keysUp: number[];
    private keysRight: number[];
    private keysDown: number[];
    private canvas: any;

    private unsubscribeFromKeyboard?: () => void;

    getClassName(): string {
        return 'FreeCameraKeyboardWalkInput';
    }
    getSimpleName(): string {
        return 'keyboard';
    }
    attachControl(noPreventDefault = false): void {
        const engine = this.camera!.getEngine();
        const element = engine.getInputElement();
        const onKeyDown = (evt: KeyboardEvent) => {
            console.log(evt.code);
            // TODO: keyCode
            if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                this.keysDown.indexOf(evt.keyCode) !== -1 ||
                this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                this.keysRight.indexOf(evt.keyCode) !== -1) {
                var index = this._keys.indexOf(evt.keyCode);
                if (index === -1) {
                    this._keys.push(evt.keyCode);
                }
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
        }
        const onKeyUp = (evt: KeyboardEvent) => {
            if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                this.keysDown.indexOf(evt.keyCode) !== -1 ||
                this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                this.keysRight.indexOf(evt.keyCode) !== -1) {
                var index = this._keys.indexOf(evt.keyCode);
                if (index >= 0) {
                    this._keys.splice(index, 1);
                }
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
        }

        element!.addEventListener("keydown", onKeyDown, false);
        element!.addEventListener("keyup", onKeyUp, false);

        this.unsubscribeFromKeyboard = () => {
            element!.removeEventListener("keydown", onKeyDown);
            element!.removeEventListener("keyup", onKeyUp);
        };
    }
    detachControl = () => {
        if (this.unsubscribeFromKeyboard){
            this.unsubscribeFromKeyboard();
            this.unsubscribeFromKeyboard = undefined;
            BABYLON.Tools.UnregisterTopRootEvents(this.canvas, [
                { name: "blur", handler: this._onLostFocus }
            ]);
            this._keys = [];
        }
    }
    checkInputs = () => {
        if (this.unsubscribeFromKeyboard) {
            var camera = this.camera;
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var speed = this.camera!.speed;
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    // TODO:
                    this.camera!.rotation.y -= (this.camera as any).angularSpeed;

                    // TODO:
                    (this.camera! as any).direction.copyFromFloats(0, 0, 0);
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    // TODO
                    (this.camera! as any).direction.copyFromFloats(0, 0, speed);
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    // TODO:
                    this.camera!.rotation.y += (this.camera as any).angularSpeed;;
                    (this.camera! as any).direction.copyFromFloats(0, 0, 0);
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    (this.camera! as any).direction.copyFromFloats(0, 0, -speed);
                }
                if (this.camera!.getScene().useRightHandedSystem) {
                    (this.camera! as any).direction.z *= -1;
                }
                this.camera!.getViewMatrix().invertToRef((this.camera as any)._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef((this.camera! as any).direction, (this.camera as any)._cameraTransformMatrix, (camera as any)._transformedDirection);
                this.camera!.cameraDirection.addInPlace((this.camera as any)._transformedDirection);
            }
        }
    }

    private _onLostFocus = () => {
        this._keys = [];
    }

}
