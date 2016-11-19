/// <reference path="../math/vector.ts" />

module gerpsquirrel.region {

    import v2 = gerpsquirrel.vector2;
    
    import Vector2 = v2.Vector2;

    export interface Region {
        contains(point: Vector2): boolean;
        nearestBoundaryPointTo(point: Vector2): Vector2;
    }

    export interface DistanceField extends Region {
        distanceAt: (point: Vector2) => number;
        boundaryPath(stepSize: number, error: number): Array<Vector2>;
    }

    export class BasicDistanceField implements DistanceField {

        distanceAt: (point: Vector2) => number;

        constructor(distanceFunction: (u: Vector2) => number) {
            this.distanceAt = distanceFunction;
        }

        gradientAt(point: Vector2): Vector2 {
            return [
                this.distanceAt([point[0] + 0.5, point[1]]) - this.distanceAt([point[0] - 0.5, point[1]]),
                this.distanceAt([point[0], point[1] + 0.5]) - this.distanceAt([point[0], point[1] - 0.5])
            ];
        }

        contains(point: Vector2): boolean {
            return this.distanceAt(point) < 0;
        }

        nearestBoundaryPointTo(point: Vector2, steps: number = 2): Vector2 {
            // Ah yeah janky gradient descent
            var v: Vector2 = [point[0], point[1]];
            for (var i = 0; i < steps; i++) {
                const distance = this.distanceAt(v);
                const gradient = this.gradientAt(v);
                v = v2.add(v, v2.scale(gradient, -distance));
            }

            return v;
        }

        boundaryPath(stepSize: number, error: number): Array<Vector2> {
            const origin = this.nearestBoundaryPointTo([0, 0]);
            var v: Vector2 = v2.add(origin, v2.scale(v2.counterClockwiseOrthogonal(this.gradientAt(origin)), stepSize));

            var points: Array<Vector2> = [];

            // walk around the boundary, counter-clockwise
            var count = 0;
            while (v2.length(v2.subtract(origin, v)) > stepSize * 0.5 && count < 1000) {
                if (this.distanceAt(v) > error) {
                    v = this.nearestBoundaryPointTo(v);
                }
                else {
                    points.push(v)
                    v = v2.add(v, v2.scale(v2.counterClockwiseOrthogonal(this.gradientAt(v)), stepSize));
                    count++;
                }
            }

            return points;
        }
    }

    export function inverse(r: DistanceField): DistanceField {
        return new BasicDistanceField((u: Vector2) => {
            return -r.distanceAt(u);
        });
    }

    export function union(...fields: Array<DistanceField>): DistanceField {
        return new BasicDistanceField((u: Vector2) => {
            return Math.min.apply(null, fields.map((field) => {
                return field.distanceAt(u);
            }));
        });
    }

    export function intersection(...fields: Array<DistanceField>): DistanceField {
        return new BasicDistanceField((u: Vector2) => {
            return Math.max.apply(null, fields.map((field) => {
                return field.distanceAt(u);
            }));
        });
    }

    export function repeat(field: DistanceField, origin: Vector2, size: Vector2): DistanceField {
        return new BasicDistanceField((u: Vector2) => {
            const v: Vector2 = v2.add([u[0] % size[0], u[1] % size[1]], origin);
            return field.distanceAt(v);
        });
    }

    export class Circle extends BasicDistanceField {
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

    export class Box extends BasicDistanceField {
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
