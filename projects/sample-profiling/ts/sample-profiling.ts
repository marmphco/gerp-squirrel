/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module sampleprofiling {

    import BaseStream = gerpsquirrel.event.BaseStream;

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');

        const generator = new BaseStream<number>();

        const handler = generator
            .filter((item: number) => {
                return item % 2 == 0;
            })
            .map((item: number) => {
                var result = "";
                for (var i = 0; i < item; i++) {
                    result += item.toString();
                }
                return result;
            })
            .filter((item: string) => {
                return item.length > 6
            })
            .handle((item: string) => {
                console.log(item);
            });

        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 6].forEach(handler);
    }
}
