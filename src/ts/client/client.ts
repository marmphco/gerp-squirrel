/// <reference path="../engine/runloop.ts" />
/// <reference path="../engine/vector.ts" />
/// <reference path="../engine/render.ts" />
/// <reference path="../client/gerp.ts" />

module Client {
    export function init(element: HTMLCanvasElement) {

        const context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);

        var t: number = 0;
        const v: number = 1;

        const render = GerpSquirrel.Canvas2DRendererMake(context);
        const renderLoop = GerpSquirrel.RenderLoopMake(1000 / 30);

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
            //context.fillRect(50 + 50 * Math.cos(t + v * timeIntoFrame), 50 + 50 * Math.sin(t + v * timeIntoFrame), 20, 20);
            render({ position: new GerpSquirrel.Vector2(0, 0) });
        }, GerpSquirrel.forever);

        renderLoop.scheduleUpdateFunction(() => {
            t += v;
        }, GerpSquirrel.forever);

        renderLoop.scheduleUpdateFunction(() => {
            console.log("fdaf");
        }, GerpSquirrel.repeat(5));

        setInterval(renderLoop.run, 1000 / 30);
    }
}
