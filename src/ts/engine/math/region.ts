/// <reference path="../math/vector.ts" />
/// <reference path="../math/distance-field-region.ts" />

module GerpSquirrel.Region {

    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface Region {
        containsVector(u: Vector2): boolean;
        nearestBoundaryVectorToVector(u: Vector2): Vector2;
    }

    export interface Circle extends DistanceField {
        center: Vector2;
        radius: number;
    }

    export function CircleMake(center: Vector2, radius: number): Circle {
        return new _Circle(center, radius);
    }

    class _Circle extends _DistanceField implements Circle {
        center: Vector2;
        radius: number;

        constructor(center: Vector2, radius: number) {
            this.center = center;
            this.radius = radius;

            super((u: Vector2) => {
                return v2.length(v2.subtract(u, this.center)) - this.radius;
            })
        }
    }

    export interface Box2 extends DistanceField {
        origin: Vector2;
        size: Vector2;
    }

    export function Box2Make(origin: Vector2, size: Vector2): Box2 {
        return new _Box2(origin, size);
    }

    class _Box2 extends _DistanceField implements Box2 {
        origin: Vector2;
        size: Vector2;

        constructor(origin: Vector2, size: Vector2) {
            this.origin = origin;
            this.size = size;

            super((u: Vector2) => {
                const halfSize = v2.scale(this.size, 0.5);
                const transformed = v2.subtract(u, v2.add(this.origin, halfSize));
                const absolute: Vector2 = [Math.abs(transformed[0]), Math.abs(transformed[1])];
                const distance = v2.subtract(absolute, halfSize);

                const greatestNegativeOrZero = Math.min(Math.max.apply(null, distance), 0.0);
                const positiveDistances: Vector2 = [Math.max(distance[0], 0.0), Math.max(distance[1], 0.0)];
                return greatestNegativeOrZero + v2.length(positiveDistances);
            });
        }
    }
}
