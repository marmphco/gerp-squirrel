/// <reference path="../engine/runloop.ts" />

console.log('herp derp girp chirp');

module Client {
    export function init(element: HTMLCanvasElement) {
        console.log('fdsafasd');
        const context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);
    }

    function fsadfs() {
        alert('fdsafdsa');
    }
}