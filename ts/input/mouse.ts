/// <reference path="../core/stream.ts" />
/// <reference path="../math/vector.ts" />

module gerpsquirrel.input {

    import Vector2 = vector2.Vector2;
    import Stream = stream.Stream;
    import BaseStream = stream.BaseStream;

    export enum MouseEventType {
        Up, Down, Click, Move
    }

    export interface MouseInfo {
        type: MouseEventType
        position: Vector2
    }

    export class MouseInput {
        private _element: Element;
        private _stream: BaseStream<MouseInfo>;

        constructor(element: Element) {
            this._element = element;
            element.addEventListener("mousedown", this._downListener);
            element.addEventListener("mouseup", this._upListener);
            element.addEventListener("click", this._clickListener);
            element.addEventListener("mousemove", this._moveListener);

            this._stream = new BaseStream();
        }

        detach(): void {
            this._element.removeEventListener("mousedown", this._downListener);
            this._element.removeEventListener("mouseup", this._upListener);
            this._element.removeEventListener("click", this._clickListener);
            this._element.removeEventListener("mousemove", this._moveListener);
        }

        stream(): Stream<MouseInfo> { 
            return this._stream; 
        }

        private elementSpacePosition(event: MouseEvent): Vector2 {
            const rect = this._element.getBoundingClientRect();
            return [event.clientX - rect.left, event.clientY - rect.top];
        }

        private _downListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Down,
                position: this.elementSpacePosition(event)
            })
        }

        private _upListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Up,
                position: this.elementSpacePosition(event)
            })
        }

        private _clickListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Click,
                position: this.elementSpacePosition(event)
            })
        }

        private _moveListener = (event: MouseEvent) => {
            this._stream.push({
                type: MouseEventType.Move,
                position: this.elementSpacePosition(event)
            })
        }
    }
}