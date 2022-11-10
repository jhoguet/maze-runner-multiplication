import { FreeCamera, ICameraInput } from 'babylonjs';
import { Nullable } from 'babylonjs/index';

export class FreeCameraSearchInput implements ICameraInput<FreeCamera>{
    constructor(touchEnabled: boolean = true) {
        this.touchEnabled = touchEnabled;
        this.buttons = [0, 1, 2];
        this.angularSensibility = 2000.0;
        this.restrictionX = 100;
        this.restrictionY = 60;
    }
    camera: Nullable<FreeCamera> = null;
    getClassName(): string {
        return 'FreeCameraSearchInput';
    }
    getSimpleName(): string {
        return 'MouseSearchCamera';
    }
    detachControl(): void {
        var engine = this.camera!.getEngine();
        var element = engine.getInputElement();
        if (this._observer && element) {
            this.camera!.getScene().onPointerObservable.remove(this._observer);
            element.removeEventListener("mousemove", this._onSearchMove);
            this._observer = null;
            this._onSearchMove = null;
            this.previousPosition = undefined;
        }
    }
    checkInputs?: (() => void) | undefined;

    // TODO: refactor
    private _pointerInput?: (p: any, s: any) => void;
    private touchEnabled?: boolean;
    private previousPosition?: { x: number, y: number };
    private _onSearchMove: any;

    // TODO
    private buttons: number[];
    private restrictionX: any;
    private restrictionY: any;
    private angularSensibility: any;
    private _observer: any;

    attachControl = (noPreventDefault?: boolean | undefined) => {
        const engine = this.camera!.getEngine();
        const element = engine.getInputElement();
        const angle = { x: 0, y: 0 };
        if (!this._pointerInput) {
            this._pointerInput = (p, s) => {
                var evt = p.event;
                if (!this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }
                if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }
                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }
                    this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element!.focus();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    }
                    catch (e) {
                        //Nothing to do with the error.
                    }
                    this.previousPosition = undefined;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (!this.previousPosition || engine.isPointerLock) {
                        return;
                    }
                    var offsetX = evt.clientX - this.previousPosition.x;
                    var offsetY = evt.clientY - this.previousPosition.y;
                    angle.x += offsetX;
                    angle.y -= offsetY;
                    if (Math.abs(angle.x) > this.restrictionX) {
                        angle.x -= offsetX;
                    }
                    if (Math.abs(angle.y) > this.restrictionY) {
                        angle.y += offsetY;
                    }
                    if (this.camera!.getScene().useRightHandedSystem) {
                        if (Math.abs(angle.x) < this.restrictionX) {
                            this.camera!.cameraRotation.y -= offsetX / this.angularSensibility;
                        }
                    }
                    else {
                        if (Math.abs(angle.x) < this.restrictionX) {
                            this.camera!.cameraRotation.y += offsetX / this.angularSensibility;
                        }
                    }
                    if (Math.abs(angle.y) < this.restrictionY) {
                        this.camera!.cameraRotation.x += offsetY / this.angularSensibility;
                    }
                    this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
            };
        }
        this._onSearchMove = function (evt: any) {
            if (!engine.isPointerLock) {
                return;
            }
            var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
            var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            if (this.camera!.getScene().useRightHandedSystem) {
                this.camera!.cameraRotation.y -= offsetX / this.angularSensibility;
            }
            else {
                this.camera!.cameraRotation.y += offsetX / this.angularSensibility;
            }
            this.camera!.cameraRotation.x += offsetY / this.angularSensibility;
            this.previousPosition = undefined;
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };
        this._observer = this.camera!.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
        element!.addEventListener("mousemove", this._onSearchMove, false);
    };

}
