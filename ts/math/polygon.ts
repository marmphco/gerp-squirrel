/// <reference path="./vector.ts" />

module gerpsquirrel.polygon {

    import v2 = vector2;
    import Vector2 = vector2.Vector2;

    export interface ProjectionInfo {
        span: Vector2 // The span of the projection along the projection axis [min, max]
        minPoint: Vector2
        maxPoint: Vector2
    }

    export class ConvexPolygon {
        vertices: Vector2[]

        constructor(vertices: Vector2[]) {
            this.vertices = vertices
        }

        contains(u: Vector2): boolean {

            var hasClockwise = false;
            var hasCounterClockwise = false;

            for (var i = 0; i < this.vertices.length; i++) {
                const base = this.vertices[i];
                const tip = this.vertices[(i + 1) % this.vertices.length];
                const edge = v2.subtract(tip, base);
                const baseToPoint = v2.subtract(u, base);
                if (v2.orientation(edge, baseToPoint) == v2.Orientation.Clockwise) {
                    hasClockwise = true;
                }
                else {
                    hasCounterClockwise = true;
                }
            }
            return hasClockwise != hasCounterClockwise;
        }
        
        centroid(): Vector2 {
            // Compute the midpoint of the comprising triangles' centroids
            var total: Vector2 = [0, 0];
            for (var i = 2; i < this.vertices.length; ++i) {
                total = v2.add(total, triangleCentroid(this.vertices[0], this.vertices[i], this.vertices[i - 1]));
            }

            return v2.scale(total, 1 / (this.vertices.length - 2));
        }

        projectedOn(axis: Vector2): ProjectionInfo {
            var projectedSpan: Vector2 = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
            var minVertex: Vector2 = [0, 0];
            var maxVertex: Vector2 = [0, 0];

            this.vertices.forEach((vertex) => {
                const projectedVertex = v2.projectedLength(vertex, axis);

                if (projectedVertex < projectedSpan[0]) {
                    projectedSpan[0] = projectedVertex;
                    minVertex = vertex;
                }
                if (projectedVertex > projectedSpan[1]) {
                    projectedSpan[1] = projectedVertex;
                    maxVertex = vertex;
                }
            });

            return {
                span: projectedSpan,
                minPoint: minVertex,
                maxPoint: maxVertex
            }
        }

        projectionAxes(other: collision.Collidable) {
            return this.vertices.map((baseVertex, index, vertices) => {
                const headVertex = vertices[(index + 1) % vertices.length];
                const edge = v2.subtract(headVertex, baseVertex);
                return v2.normalize(v2.counterClockwiseOrthogonal(edge));
            });
        }
    }

    // returns the centroid of triangle with vertices `a`, `b`, and `c`.
    //   b
    //   |\     Medians are:
    //   + \    u: c to mid(a, b)
    //   |  \   v: b to mid(a, c)
    //   a-+-c
    export function triangleCentroid(a: Vector2, b: Vector2, c: Vector2): Vector2 {
        
        const base1 = v2.scale(v2.add(a, b), 0.5); // a-b midpoint
        const base2 = v2.scale(v2.add(a, c), 0.5); 
                      v2.by((i) => (a[i] + c[i]) / 2); // a-c midpoint

        const dir1 = v2.normalize(v2.subtract(base1, c)); // a-b midpoint to c
        const dir2 = v2.normalize(v2.subtract(base2, b)); // a-c midpoint to b

        const base2Projected = v2.add(v2.project(v2.subtract(base2, base1), dir1), base1);
        const base2ToBase2Projected = v2.subtract(base2Projected, base2);

        const dir2OnDir1Length = v2.projectedLength(dir2, dir1);
        const dir2OnDir2OrthoLength = v2.projectedLength(dir2, base2ToBase2Projected);

        const distFromBase1 = v2.length(base2ToBase2Projected) * dir2OnDir1Length / dir2OnDir2OrthoLength;

        return v2.add(base2Projected, v2.scale(dir1, distFromBase1));
    }

    export function triangleArea(a: Vector2, b: Vector2, c: Vector2): number {
        const centroid = triangleCentroid(a, b, c);
        const base = v2.length(v2.subtract(b, c));

        const aOnBC = v2.add(b, v2.project(v2.subtract(a, b), v2.subtract(c, b)));
        const height = v2.length(v2.subtract(a, aOnBC));

        return base * height / 2;
    }
}