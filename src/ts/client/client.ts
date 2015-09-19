/// <reference path="../engine/runloop.ts" />

console.log('herp derp girp chirp');

module Client {
    export function init(element: HTMLCanvasElement) {
        console.log('fdsafasd');
        const context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);

        var t: number = 0;
        const v: number = 1;

        setInterval(GerpSquirrel.RenderLoopMake(1000/30, (timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
            context.fillRect(50 + 50 * Math.cos(t + v * timeIntoFrame), 50 + 50 * Math.sin(t + v * timeIntoFrame), 20, 20);
        }, () => {
            t += v;
        }), 1000/60)
    }

    function fsadfs() {
        alert('fdsafdsa');
    }
}

