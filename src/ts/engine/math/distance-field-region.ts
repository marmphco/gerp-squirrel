/// <reference path="../math/vector.ts" />
/// <reference path="../math/region.ts" />

// ahhh yeah signed distance functions
module GerpSquirrel.Region {

    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface DistanceField extends Region {
        distanceAtVector: (u: Vector2) => number;
        intersect(field: DistanceField, stepSize: number): Array<Vector2>;
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

        intersect(field: DistanceField, stepSize: number = 10.0): Array<Vector2> {
            const origin = this.nearestBoundaryVectorToVector([0, 0]);
            var v: Vector2 = v2.add(origin, v2.scale(v2.leftOrthogonal(this.gradientAtVector(origin)), stepSize));

            var points: Array<Vector2> = [];

            // walk around the boundary, counter-clockwise
            var count = 0;
            while (v2.length(v2.subtract(origin, v)) > stepSize * 0.5 && count < 100) {
                if (this.distanceAtVector(v) > 1.0) {
                    v = this.nearestBoundaryVectorToVector(v);
                }
                else {
                    if (field.containsVector(v)) {
                        points.push(v);
                    }
                    v = v2.add(v, v2.scale(v2.leftOrthogonal(this.gradientAtVector(v)), stepSize));
                }
                count++;
            }

            return points;
        }
    }

    export function inverse(r: DistanceField): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            return -r.distanceAtVector(u);
        });
    }

    export function union(r: DistanceField, s: DistanceField): DistanceField {
        return DistanceFieldMake((u: Vector2) => {
            return Math.min(r.distanceAtVector(u), s.distanceAtVector(u));
        });
    }

    export function intersection(r: DistanceField, s: DistanceField): DistanceField {
        return null;
    }
}
