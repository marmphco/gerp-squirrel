/// <reference path="../core/lazy.ts" />
/// <reference path="box.ts" />
/// <reference path="shape.ts" />
/// <reference path="vector.ts" />

module gerpsquirrel.polygon {

    import v2 = vector2;

    import Box = box.Box;
    import Lazy = lazy.Lazy;
    import Shape = shape.Shape;
    import ShapeProjection = shape.ShapeProjection;
    import Vector2 = vector2.Vector2;

    export class ConvexPolygon implements Shape {
        private _vertices: Vector2[]
        private _bounds: Lazy<Box>
        private _centroid: Lazy<Vector2>
        private _projectionAxes: Lazy<Vector2[]>

        constructor(vertices: Vector2[]) {
            this._vertices = vertices

            this._bounds = new Lazy(() => {
                var minX = Number.MAX_VALUE;
                var maxX = Number.MIN_VALUE;
                var minY = Number.MAX_VALUE;
                var maxY = Number.MIN_VALUE;

                this._vertices.forEach((vertex) => {
                    minX = Math.min(minX, vertex[0]);
                    maxX = Math.max(maxX, vertex[0]);
                    minY = Math.min(minY, vertex[1]);
                    maxY = Math.max(maxY, vertex[1]);
                });

                return new Box([minX, minY], [maxX - minX, maxY - minY]);
            });

            this._centroid = new Lazy(() => convexCentroid(this._vertices))

            this._projectionAxes = new Lazy(() => {
                return this._vertices.map((baseVertex, index, vertices) => {
                    const headVertex = vertices[(index + 1) % vertices.length];
                    const edge = v2.subtract(headVertex, baseVertex);
                    return v2.normalize(v2.counterClockwiseOrthogonal(edge));
                });
            })
        }

        vertices(): Vector2[] {
            return this._vertices;
        }

        // Shape

        bounds(): Box {
            return this._bounds.value()
        }

        centroid(): Vector2 {
            return this._centroid.value()
        }

        contains(u: Vector2): boolean {

            var hasClockwise = false;
            var hasCounterClockwise = false;

            for (var i = 0; i < this._vertices.length; i++) {
                const base = this._vertices[i];
                const tip = this._vertices[(i + 1) % this._vertices.length];
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

        projectionAxes(other: Shape) {
            return this._projectionAxes.value();
        }

        projectedOn(axis: Vector2): ShapeProjection {
            var projectedSpan: Vector2 = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
            var minVertex: Vector2 = [0, 0];
            var maxVertex: Vector2 = [0, 0];

            this._vertices.forEach((vertex) => {
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

        secondMoment(density: number): number {
            var totalMoment: number = 0;
            var totalArea: number = 0;

            const vertices = this._vertices;
            
            for (var i = 0; i < vertices.length; ++i) {
                const vertex1 = vertices[i];
                const vertex2 = vertices[(i + 1) % vertices.length];
                const triangleMoment = triangleSecondMoment(v2.ZERO, vertex1, vertex2, v2.ZERO, density);
                const area = triangleArea(v2.ZERO, vertex1, vertex2);
                totalMoment += triangleMoment * area;
                totalArea += area;
            }
            return totalMoment / totalArea;
        }
    }

    export function convexCentroid(vertices: Vector2[]): Vector2 {
        // Compute the midpoint of the comprising triangles' centroids
        var total: Vector2 = [0, 0];
        for (var i = 2; i < vertices.length; ++i) {
            total = v2.add(total, triangleCentroid(vertices[0], vertices[i], vertices[i - 1]));
        }

        return v2.scale(total, 1 / (vertices.length - 2));
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

    // computes moment assumming density is uniformly distributed
    export function triangleSecondMoment(a: Vector2, b: Vector2, c: Vector2, axis: Vector2, density: number): number {
        const centroid = polygon.triangleCentroid(a, b, c);
        const base = v2.length(v2.subtract(b, c));

        const aOnBC = v2.add(b, v2.project(v2.subtract(a, b), v2.subtract(c, b)));
        const height = v2.length(v2.subtract(a, aOnBC));
        const semibase = v2.length(v2.subtract(aOnBC, b));

        // parallel axis theorem factor
        const parallelAxisFactor = v2.lengthSquared(v2.subtract(axis, centroid));

        return ((base * base
                 - base * semibase
                 + semibase * semibase
                 + height * height) / 18 + parallelAxisFactor) * density;
    }
}
