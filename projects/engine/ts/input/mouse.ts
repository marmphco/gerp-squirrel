/// <reference path="../core/event.ts" />
/// <reference path="../math/vector.ts" />
/*
module gerpsquirrel.input {

    import Vector2 = vector2.Vector2;
    import Source = event.Source;
    import Stream = event.Stream;

    export interface MouseInfo {
        position: Vector2
    }
    
    export interface MouseInput {
        attachToElement(element: Element): void;
        detachFromElement(): void;

        downSource(): Source<MouseInfo>;
        upSource(): Source<MouseInfo>;
        clickSource(): Source<MouseInfo>;
        moveSource(): Source<MouseInfo>;
    }

    export function MouseInputMake(): MouseInput {
        return new _MouseInput();
    }

    class _MouseInput implements MouseInput {
        _element: Element;
        _downStream: Stream<MouseInfo>;
        _upStream: Stream<MouseInfo>;
        _clickStream: Stream<MouseInfo>;
        _moveStream: Stream<MouseInfo>;

        constructor() {
            this._element = null;
            this._downStream = new Stream();
            this._upStream = new Stream();
            this._clickStream = new Stream();
            this._moveStream = new Stream();
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

        downSource() { return this._downStream; }

        upSource() { return this._upStream; }

        clickSource() { return this._clickStream; }

        moveSource() { return this._moveStream; }

        _elementSpacePosition(event: MouseEvent): Vector2 {
            const rect = this._element.getBoundingClientRect();
            return [event.clientX - rect.left, event.clientY - rect.top];
        }

        _downListener = (event: MouseEvent) => {
            this._downStream.publish({
                position: this._elementSpacePosition(event)
            })
        }

        _upListener = (event: MouseEvent) => {
            this._upStream.publish({
                position: this._elementSpacePosition(event)
            })
        }

        _clickListener = (event: MouseEvent) => {
            this._clickStream.publish({
                position: this._elementSpacePosition(event)
            })
        }

        _moveListener = (event: MouseEvent) => {
            this._moveStream.publish({
                position: this._elementSpacePosition(event)
            })
        }
    }
}*/