/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module sampleprofiling {

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');
        console.log("herpa");
    }
}
