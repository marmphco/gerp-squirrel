/// <reference path="../core/event.ts" />
/// <reference path="../math/vector.ts" />

module gerpsquirrel.input {

    import Vector2 = vector2.Vector2;
    import Stream = event.Stream;
    import BaseStream = event.BaseStream;

    export enum MouseEventType {
        Up, Down, Click, Move
    }

    export interface MouseInfo {
        type: MouseEventType
        position: Vector2
    }
    
    export interface MouseInput {
        attachToElement(element: Element): void;
        detachFromElement(): void;

        stream(): Stream<MouseInfo>;
    }

    export function MouseInputMake(): MouseInput {
        return new _MouseInput();
    }

    class _MouseInput implements MouseInput {
        _element: Element;
        _stream: BaseStream<MouseInfo>;

        constructor() {
            this._element = null;
            this._stream = new BaseStream();
        }

        attachToElement(element: Element): void {
            this._element = element;
            element.addEventListener("mousedown", this._downListener);
            element.addEventListener("mouseup", this._upListener);
            element.addEventListener("click", this._clickListener);
            element.addEventListener("mousemove", this._moveListener);
        }

        detachFromElement(): void {
            this._element.removeEventListener("mousedown", this._downListener);
            this._element.removeEventListener("mouseup", this._upListener);
            this._element.removeEventListener("click", this._clickListener);
            this._element.removeEventListener("mousemove", this._moveListener);
        }

        stream() { return this._stream; }

        private elementSpacePosition(event: MouseEvent): Vector2 {
            const rect = this._element.getBoundingClientRect();
            return [event.clientX - rect.left, event.clientY - rect.top];
        }

        _downListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Down,
                position: this.elementSpacePosition(event)
            })
        }

        _upListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Up,
                position: this.elementSpacePosition(event)
            })
        }

        _clickListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Click,
                position: this.elementSpacePosition(event)
            })
        }

        _moveListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Move,
                position: this.elementSpacePosition(event)
            })
        }
    }
}