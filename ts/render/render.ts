module gerpsquirrel.render {

    export interface RenderFunction {
        (elapsedTime: number, t: number): void;
    }

    export interface Renderable<T> {
        renderInfo: (elapsedTime: number, updateIntervalFraction: number) => T;
    }

    export interface Canvas2DRenderFunction<T> {
        (context: CanvasRenderingContext2D, item: T): void;
    }
}
