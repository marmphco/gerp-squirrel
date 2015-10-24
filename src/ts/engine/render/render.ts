module GerpSquirrel {

    export interface Interpolatable<T> {
        interpolate: (timeIntoFrame: number) => T;
    }

    export interface Renderer<T> {
        run: RenderFunction;
        addItem: (item: Interpolatable<T>) => void;
    }

    export interface Canvas2DRenderFunction<T> {
        (context: CanvasRenderingContext2D, item: T): void;
    }

    export function Canvas2DRendererMake<T>(context: CanvasRenderingContext2D, render: Canvas2DRenderFunction<T>): Renderer<T> {
        var items: Array<Interpolatable<T>> = [];

        return {
            run: function(timeIntoFrame: number) {
                items.forEach(function(item: Interpolatable<T>) {
                    render(context, item.interpolate(timeIntoFrame));
                });
            },
            addItem: function(item: Interpolatable<T>) {
                items.push(item);
            }
        };
    }
}
