/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module sampleprofiling {

    import StreamGenerator = gerpsquirrel.event.StreamGenerator;

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');
        console.log("herpa");

        const generator = new StreamGenerator<number, number>();

        const handler = generator.filter((item: number) => {
            return item % 2 == 0;
        }).filter((item: number) => {
            return item % 3 == 0;
        }).handle((item: number) => {
            console.log(item);
        });

        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 6].forEach(handler);
    }
}
