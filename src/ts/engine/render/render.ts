module gerpsquirrel.render {

    export interface Renderable<T> {
        renderInfo: (timeIntoFrame: number) => T;
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
            run: function(timeIntoFrame: number) {
                items.forEach(function(item: Renderable<T>) {
                    render(context, item.renderInfo(timeIntoFrame));
                });
            },
            addItem: function(item: Renderable<T>) {
                items.push(item);
            }
        };
    }
}
