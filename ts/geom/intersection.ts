/// <reference path="../geom/shape.ts" />

module gerpsquirrel.intersection {

    import v2 = vector2;

    import Shape = shape.Shape;
    import ShapeProjection = shape.ShapeProjection;
    import Vector2 = vector2.Vector2;

    export class Intersection {
        positions: [Vector2, Vector2];
        depth: number; // magnitude of 

        constructor(positions: [Vector2, Vector2] = [[0, 0], [0, 0]],
                    depth: number = Number.MAX_VALUE) {

            this.positions = positions;
            this.depth = depth;
        }

        get isTrivial(): boolean {
            return this.depth < 0.001;
        }

        get axis(): Vector2 {
            return v2.subtract(this.positions[0], this.positions[1]);
        }

        get normal(): Vector2 {
            return v2.normalize(this.axis);
        }

        get tangent(): Vector2 {
            return v2.clockwiseOrthogonal(this.normal);
        }

        reverse(): Intersection {
            return new Intersection([this.positions[1], this.positions[0]],
                                     this.depth);
        }

        toLocalSpace(u: Vector2): Vector2 {
            return [
                v2.dot(u, this.tangent),
                v2.dot(u, this.normal)
            ];
        }

        fromLocalSpace(u: Vector2): Vector2 {
            return [
                v2.dot(u, this.toLocalSpace([1, 0])),
                v2.dot(u, this.toLocalSpace([0, 1]))
            ];
        }
    }

    export function SATIntersection(shape0: Shape, shape1: Shape): Intersection | null {

        const checkProjectionAxes = function(shape: Shape, otherShape: Shape): Intersection | null {
            var minimumDepthCollision: Intersection = new Intersection();

            const projectionAxes = shape.projectionAxes(otherShape);

            for (var i = 0; i < projectionAxes.length; i++) {
                const projectionAxis = projectionAxes[i];
                const projectionInfo = shape.projectedOn(projectionAxis);
                const span = projectionInfo.span;

                const otherProjectionInfo = otherShape.projectedOn(projectionAxis);
                const otherSpan = otherProjectionInfo.span;

                if (span[0] >= otherSpan[1] || span[1] <= otherSpan[0]) {
                    return null;
                }

                const depthA = otherSpan[1] - span[0];
                const depthB = span[1] - otherSpan[0];

                if (depthA < depthB) {
                    if (depthA < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo.maxPoint, 
                            v2.add(otherProjectionInfo.maxPoint, v2.scale(projectionAxis, -depthA))
                        ];
                        minimumDepthCollision = new Intersection(positions, depthA);
                    }
                }
                else {
                    if (depthB < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo.minPoint,
                            v2.add(otherProjectionInfo.minPoint, v2.scale(projectionAxis, depthB))
                        ];
                        minimumDepthCollision = new Intersection(positions, depthB);
                    }
                }
            }

            if (minimumDepthCollision.isTrivial) {
                return null;
            }

            return minimumDepthCollision;
        }

        const minimumDepthCollision0 = checkProjectionAxes(shape0, shape1);
        if (!minimumDepthCollision0) {
            return null;
        }

        const minimumDepthCollision1 = checkProjectionAxes(shape1, shape0);
        if (!minimumDepthCollision1) {
            return null;
        }

        if (minimumDepthCollision0.depth < minimumDepthCollision1.depth) {
            return minimumDepthCollision0;
        }
        else {
            return minimumDepthCollision1.reverse();
        }
    }
}
