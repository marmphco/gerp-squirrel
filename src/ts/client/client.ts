/// <reference path="../engine/runloop.ts" />
/// <reference path="../engine/vector.ts" />
/// <reference path="../engine/render.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;

module Client {

    interface RenderInfo {
        position: v2.Vector2;
    }

    interface Physical {
        position: v2.Vector2;
        velocity: v2.Vector2;
    }

    class Test implements gs.Interpolatable<RenderInfo>, Physical {
        position: v2.Vector2;
        velocity: v2.Vector2;

        constructor() {
            this.position = [Math.random() * 100, Math.random() * 100]
            this.velocity = [Math.random() * 2 + 2, Math.random() * 2 + 2]
        }

        interpolate(timeIntoFrame: number) {
            return {
                position: v2.add(this.position, v2.scale(this.velocity, timeIntoFrame))
            }
        }
    }

    export function init(element: HTMLCanvasElement) {

        const context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);

        const renderer = gs.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillRect(item.position[0], item.position[1], 20, 20);
        });
        const renderLoop = gs.RunLoopMake(1000 / 30);

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
        }, gs.forever);

        renderLoop.scheduleRenderFunction(renderer.run, gs.forever);

        renderLoop.scheduleUpdateFunction(() => {
            const item = new Test();
            renderer.addItem(item);
            renderLoop.scheduleUpdateFunction(() => {
                item.position = v2.add(item.position, item.velocity);
            }, () => {
                return item.position[1] < element.height - 20 && item.position[0] < element.width - 20;
            });
        }, gs.repeat(1000));

        setInterval(renderLoop.run, 1000 / 30);
    }
}
