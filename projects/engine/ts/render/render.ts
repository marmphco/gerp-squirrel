module gerpsquirrel.render {

    export interface Renderable<T> {
        renderInfo: (elapsedTime: number, updateIntervalFraction: number) => T;
    }

    export interface Renderer<T> {
        run: RenderFunction;
        addItem: (item: Renderable<T>) => void;
    }

    export interface Canvas2DRenderFunction<T> {
        (context: CanvasRenderingContext2D, item: T): void;
    }

    export function Canvas2DRendererMake<T>(context: CanvasRenderingContext2D, render: Canvas2DRenderFunction<T>): Renderer<T> {
        var items: Array<Renderable<T>> = [];

        return {
            run: function(elapsedTime: number, updateIntervalFraction: number) {
                items.forEach(function(item: Renderable<T>) {
                    render(context, item.renderInfo(elapsedTime, updateIntervalFraction));
                });
            },
            addItem: function(item: Renderable<T>) {
                items.push(item);
            }
        };
    }
}
