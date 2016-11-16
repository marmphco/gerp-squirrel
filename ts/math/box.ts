/// <reference path="../math/vector.ts" />

module gerpsquirrel.box {

    import v2 = vector2;

    import Vector2 = vector2.Vector2;

    export class Box {
        center: Vector2;
        halfSize: Vector2;

        constructor(center: Vector2, halfSize: Vector2) {
            this.center = center;
            this.halfSize = halfSize;
        }

        containsPoint(point: Vector2): boolean {
            if (point[0] < this.center[0] - this.halfSize[0]) {
                return false;
            }
            if (point[1] < this.center[1] - this.halfSize[1]) {
                return false;
            }
            if (point[0] > this.center[0] + this.halfSize[0]) {
                return false;
            }
            if (point[1] > this.center[1] + this.halfSize[1]) {
                return false;
            }

            return true;
        }

        intersects(box: Box): boolean {
            if (box.center[0] + box.halfSize[0] < this.center[0] - this.halfSize[0]) {
                return false;
            }
            if (box.center[1] + box.halfSize[1] < this.center[1] - this.halfSize[1]) {
                return false;
            }
            if (box.center[0] - box.halfSize[0] > this.center[0] + this.halfSize[0]) {
                return false;
            }
            if (box.center[1] - box.halfSize[1] > this.center[1] + this.halfSize[1]) {
                return false;
            }

            return true;
        }
    }

    export function boxWithBounds(bounds: [Vector2, Vector2]): Box {
        const center = v2.scale(v2.add(bounds[0], bounds[1]), 0.5);
        const halfSize = v2.scale(v2.subtract(bounds[1], bounds[0]), 0.5);
        return new Box(center, halfSize);
    }
}