/// <reference path="../math/vector.ts" />

module gerpsquirrel.region {

    import v2 = gerpsquirrel.vector2;
    
    import Vector2 = v2.Vector2;

    export interface Region {
        containsVector(u: Vector2): boolean;
        nearestBoundaryVectorToVector(u: Vector2): Vector2;
    }

    export interface DistanceField extends Region {
        distanceAtVector: (u: Vector2) => number;
        boundaryPath(stepSize: number, error: number): Array<Vector2>;
    }

    export function DistanceFieldMake(distanceFunction: (u: Vector2) => number): DistanceField {
        return new _DistanceField(distanceFunction);
    }

    class _DistanceField implements DistanceField {

        distanceAtVector: (u: Vector2) => number;

        constructor(distanceFunction: (u: Vector2) => number) {
            this.distanceAtVector = distanceFunction;
        }

        gradientAtVector(u: Vector2): Vector2 {
            return [
                this.distanceAtVector([u[0] + 0.5, u[1]]) - this.distanceAtVector([u[0] - 0.5, u[1]]),
                this.distanceAtVector([u[0], u[1] + 0.5]) - this.distanceAtVector([u[0], u[1] - 0.5])
            ];
        }

        containsVector(u: Vector2): boolean {
            return this.distanceAtVector(u) < 0;
        }

        nearestBoundaryVectorToVector(u: Vector2, steps: number = 2): Vector2 {
            // Ah yeah janky gradient descent
            var v: Vector2 = [u[0], u[1]];
            for (var i = 0; i < steps; i++) {
                const distance = this.distanceAtVector(v);
                const gradient = this.gradientAtVector(v);
                v = v2.add(v, v2.scale(gradient, -distance));
            }

            return v;
        }

        boundaryPath(stepSize: number, error: number): Array<Vector2> {
            const origin = this.nearestBoundaryVectorToVector([0, 0]);
            var v: Vector2 = v2.add(origin, v2.scale(v2.counterClockwiseOrthogonal(this.gradientAtVector(origin)), stepSize));

            var points: Array<Vector2> = [];

            // walk around the boundary, counter-clockwise
            var count = 0;
            while (v2.length(v2.subtract(origin, v)) > stepSize * 0.5 && count < 1000) {
                if (this.distanceAtVector(v) > error) {
                    v = this.nearestBoundaryVectorToVector(v);
                }
                else {
                    points.push(v)
                    v = v2.add(v, v2.scale(v2.counterClockwiseOrthogonal(this.gradientAtVector(v)), stepSize));
                    count++;
                }
            }

            return points;
        }
    }

    export function inverse(r: DistanceField): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            return -r.distanceAtVector(u);
        });
    }

    export function union(...fields: Array<DistanceField>): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            return Math.min.apply(null, fields.map((field) => {
                return field.distanceAtVector(u);
            }));
        });
    }

    export function intersection(...fields: Array<DistanceField>): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            return Math.max.apply(null, fields.map((field) => {
                return field.distanceAtVector(u);
            }));
        });
    }

    export function repeat(field: DistanceField, origin: Vector2, size: Vector2): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            const v: Vector2 = v2.add([u[0] % size[0], u[1] % size[1]], origin);
            return field.distanceAtVector(v);
        });
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
            super((u: Vector2) => {
                return v2.length(v2.subtract(u, center)) - radius;
            });

            this.center = center;
            this.radius = radius;
        }
    }

    export interface Box extends DistanceField {
        origin: Vector2;
        size: Vector2;
    }

    export function BoxMake(origin: Vector2, size: Vector2): Box {
        return new _Box(origin, size);
    }

    class _Box extends _DistanceField implements Box {
        origin: Vector2;
        size: Vector2;

        constructor(origin: Vector2, size: Vector2) {
            super((u: Vector2) => {
                const halfSize = v2.scale(size, 0.5);
                const transformed = v2.subtract(u, v2.add(origin, halfSize));
                const absolute: Vector2 = [Math.abs(transformed[0]), Math.abs(transformed[1])];
                const distance = v2.subtract(absolute, halfSize);

                const greatestNegativeOrZero = Math.min(Math.max.apply(null, distance), 0.0);
                const positiveDistances: Vector2 = [Math.max(distance[0], 0.0), Math.max(distance[1], 0.0)];
                return greatestNegativeOrZero + v2.length(positiveDistances);
            });

            this.origin = origin;
            this.size = size;
        }
    }
}
