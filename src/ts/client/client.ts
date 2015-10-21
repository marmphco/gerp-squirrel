/// <reference path="../engine/runloop.ts" />
/// <reference path="../engine/vector.ts" />
/// <reference path="../engine/render.ts" />
/// <reference path="../client/gerp.ts" />

module Client {

    interface RenderInfo {
        position: GerpSquirrel.Vector2;
    }

    interface Physical {
        position: GerpSquirrel.Vector2;
        velocity: GerpSquirrel.Vector2;
    }

    class Test implements GerpSquirrel.Interpolatable<RenderInfo>, Physical {
        position: GerpSquirrel.Vector2;
        velocity: GerpSquirrel.Vector2;

        constructor() {
            this.position = new GerpSquirrel.Vector2(Math.random()*100, Math.random()*100)
            this.velocity = new GerpSquirrel.Vector2(Math.random(), Math.random())
        }

        interpolate(timeIntoFrame: number) {
            return {
                position: this.position.add(this.velocity.scale(timeIntoFrame))
            }
        }
    }

    export function init(element: HTMLCanvasElement) {

        const context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);

        const renderer = GerpSquirrel.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillRect(item.position.x, item.position.y, 20, 20);
        });
        renderer.addItem(new Test());
        const renderLoop = GerpSquirrel.RunLoopMake(1000 / 30);

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
        }, GerpSquirrel.forever);

        renderLoop.scheduleRenderFunction(renderer.run, GerpSquirrel.forever);

        renderLoop.scheduleUpdateFunction(() => {
            const item = new Test();
            renderer.addItem(item);
            renderLoop.scheduleUpdateFunction(() => {
                item.position = item.position.add(item.velocity);
            }, GerpSquirrel.forever);
        }, GerpSquirrel.repeat(50));

        setInterval(renderLoop.run, 1000 / 30);
    }
}
