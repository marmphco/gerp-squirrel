/// <reference path="../engine/vector.ts" />

module GerpSquirrel {
    export interface Renderer {
        (renderable: Renderable): void;
    }

    export interface Renderable {
        position: GerpSquirrel.Vector2;
    }

    export function Canvas2DRendererMake(context: CanvasRenderingContext2D): Renderer {
        return function(renderable: Renderable) {
            context.fillRect(renderable.position.x, renderable.position.y, 20, 20);
        };
    }
}
