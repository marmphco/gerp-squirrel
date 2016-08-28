/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module samplestream {

    import BaseStream = gerpsquirrel.stream.BaseStream;

    export function init() {
        const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const stream = new BaseStream<number>()

        // Map
        const mapID = stream
            .map((x) => x.toString() + "-" + x.toString())
            .handle((x) => {
                console.log("map " + x)
            })

        testData.forEach((x) => stream.push(x))
        stream.removeHandler(mapID)

        // Filter
        const filterID = stream
            .filter((x) => x % 2 == 0)
            .handle((x) => {
                console.log("filter " + x.toString())
            })

        testData.forEach((x) => stream.push(x))
        stream.removeHandler(filterID)

        // Buffer
        const bufferID = stream.buffer(4).handle((buffer) => {
            console.log("buffer " + buffer.map((x) => x.toString()).join(' '))
        });

        testData.forEach((x) => stream.push(x))
        stream.removeHandler(bufferID)

        // Window
        const windowID = stream.window(4).handle((buffer) => {
            console.log("window " + buffer.map((x) => x.toString()).join(' '))
        });

        testData.forEach((x) => stream.push(x))
        stream.removeHandler(windowID)
    }
}
