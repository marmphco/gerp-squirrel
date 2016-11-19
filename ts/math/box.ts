/// <reference path="../math/vector.ts" />

module gerpsquirrel.box {

    import v2 = vector2;

    import Vector2 = vector2.Vector2;

    export class Box {
        origin: Vector2;
        size: Vector2;

        static withBounds(bounds: [Vector2, Vector2]): Box {
            return new Box(bounds[0], v2.subtract(bounds[1], bounds[0]))
        }

        static withCenterandHalfSize(center: Vector2, halfSize: Vector2): Box {
            return new Box(v2.subtract(center, halfSize), v2.scale(halfSize, 2))
        }

        constructor(origin: Vector2, size: Vector2) {
            this.origin = origin;
            this.size = size;
        }

        center(): Vector2 {
            return v2.add(this.origin, v2.scale(this.size, 0.5))
        }

        containsPoint(point: Vector2): boolean {
            if (point[0] < this.origin[0]) {
                return false;
            }
            if (point[1] < this.origin[1]) {
                return false;
            }
            if (point[0] > this.origin[0] + this.size[0]) {
                return false;
            }
            if (point[1] > this.origin[1] + this.size[1]) {
                return false;
            }

            return true;
        }

        intersects(box: Box): boolean {
            if (box.origin[0] + box.size[0] < this.origin[0]) {
                return false;
            }
            if (box.origin[1] + box.size[1] < this.origin[1]) {
                return false;
            }
            if (box.origin[0] > this.origin[0] + this.size[0]) {
                return false;
            }
            if (box.origin[1] > this.origin[1] + this.size[1]) {
                return false;
            }

            return true;
        }
    }
}