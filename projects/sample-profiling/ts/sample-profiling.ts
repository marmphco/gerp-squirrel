/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module sampleprofiling {

    import BaseStream = gerpsquirrel.event.BaseStream;

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');

        const stream = new BaseStream<number>();

        stream
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

        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 6].forEach((num) => {
            stream.push(num);
        });

        stream.handle((item: number) => {
            console.log("Base Handling " + item)
        });

        const processedStream = stream.filter((item: number) => {
            return Math.sqrt(item) - Math.floor(Math.sqrt(item)) == 0;
        })

        const firstHandler = processedStream.handle((item: number) => {
            console.log("Processed Handling " + item)
        })

        const secondHandler = processedStream.handle((item: number) => {
            console.log("Processed Handling again " + item)
        })

        stream.push(55);
        stream.push(16);
        stream.push(43);
        stream.push(9);

        processedStream.removeHandler(firstHandler);

        stream.push(55);
        stream.push(16);
        stream.push(43);
        stream.push(9);
    }
}
