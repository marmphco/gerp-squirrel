/// <reference path="../math/vector.ts" />
/// <reference path="../math/region.ts" />

// ahhh yeah signed distance functions
module GerpSquirrel.Region {

    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface DistanceField extends Region {
        distanceAtVector: (u: Vector2) => number;
    }

    export function DistanceFieldMake(distanceFunction: (u: Vector2) => number): DistanceField {
        return new _DistanceField(distanceFunction);
    }

    class _DistanceField implements DistanceField {

        distanceAtVector: (u: Vector2) => number;

        constructor(distanceFunction: (u: Vector2) => number) {
            this.distanceAtVector = distanceFunction;
        }

        containsVector(u: Vector2): boolean {
            return this.distanceAtVector(u) < 0;
        }

        nearestBoundaryVectorToVector(u: Vector2): Vector2 {
            // Ah yeah janky gradient descent
            const steps = 2;

            var v: Vector2 = [u[0], u[1]];
            for (var i = 0; i < steps; i++) {
                const distance = this.distanceAtVector(v);
                const gradient: Vector2 = [
                    this.distanceAtVector([v[0] + 0.5, v[1]]) - this.distanceAtVector([v[0] - 0.5, v[1]]),
                    this.distanceAtVector([v[0], v[1] + 0.5]) - this.distanceAtVector([v[0], v[1] - 0.5])
                ];
                v = v2.add(v, v2.scale(gradient, -distance));
            }

            return v;
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
