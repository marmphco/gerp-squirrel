/// <reference path="../math/vector.ts" />
/// <reference path="../math/box.ts" />
/// <reference path="../dynamics/actor.ts" />

module gerpsquirrel.dynamics {

    import v2 = vector2;
    
    import Box = box.Box;
    import Vector2 = vector2.Vector2;

    export class ConvexHull {
        actor: Actor;
        private _vertices: Array<Vector2>;

        // For caching TODO rename these
        private _center: Vector2;
        private _orientation: number;
        private _cachedWorldVertices: Array<Vector2>;

        private _boundsCenter: Vector2;
        private _boundsOrientation: number;
        private _cachedBounds: Box;

        constructor(vertices: Array<Vector2>) {
            this.actor = new Actor(1, 1);

            // compute center of mass, assuming uniform mass distribution
            const centerOfMass = convexCentroid(vertices);

            this._vertices = vertices.map((vertex) => v2.subtract(vertex, centerOfMass));

            // Set up caching properties
            this._center = this.actor.center();
            this._orientation = this.actor.orientation();
            this._cachedWorldVertices = null;

            this._boundsCenter = this.actor.center();
            this._boundsOrientation = this.actor.orientation();
            this._cachedBounds = null;
        }

        localVertices() {
            return this._vertices;
        }

        worldVertices() {
            if (!this._cachedWorldVertices
                || this._center[0] != this.actor.center()[0]
                || this._center[1] != this.actor.center()[1]
                || this._orientation != this.actor.orientation()) {

                this._center = this.actor.center();
                this._orientation = this.actor.orientation();
                this._cachedWorldVertices = this._vertices.map((vertex) => this.actor.fromLocalSpace(vertex));
            }
               
            return this._cachedWorldVertices;
        }

        worldVerticesInterpolated(t: number) {
            // cant cache these
            return this._vertices.map((vertex) => this.actor.fromLocalSpaceInterpolated(vertex, t));
        }

        worldBounds() {
            if (!this._cachedBounds
                || this._boundsCenter[0] != this.actor.center()[0]
                || this._boundsCenter[1] != this.actor.center()[1]
                || this._boundsOrientation != this.actor.orientation()) {

                this._boundsCenter = this.actor.center();
                this._boundsOrientation = this.actor.orientation();

                var minX = Number.MAX_VALUE;
                var maxX = Number.MIN_VALUE;
                var minY = Number.MAX_VALUE;
                var maxY = Number.MIN_VALUE;

                this.worldVertices().forEach((vertex) => {
                    minX = Math.min(minX, vertex[0]);
                    maxX = Math.max(maxX, vertex[0]);
                    minY = Math.min(minY, vertex[1]);
                    maxY = Math.max(maxY, vertex[1]);
                });
                this._cachedBounds = new Box([(maxX + minX) / 2, (maxY + minY) / 2], [(maxX - minX) / 2, (maxY - minY) / 2]);
            }
            return this._cachedBounds;
        }

        projectedOn(axis: Vector2): [Vector2, Vector2, Vector2] {
            var projectedSpan: Vector2 = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
            var minVertex: Vector2 = [0, 0];
            var maxVertex: Vector2 = [0, 0];

            this.worldVertices().forEach((vertex) => {
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

            return [projectedSpan, minVertex, maxVertex];
        }
    }

    // TODO maybe this general hull stuff should be abstracted away from the dynamics stuff.

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

    // returns the centroid of a convex polygon
    // vertices.length >= 3
    export function convexCentroid(vertices: Array<Vector2>): Vector2 {
        // Compute the average of the comprising triangle's centroids
        var total: Vector2 = [0, 0];
        for (var i = 2; i < vertices.length; ++i) {
            total = v2.add(total, triangleCentroid(vertices[0], vertices[i], vertices[i - 1]));
        }

        return v2.scale(total, 1 / (vertices.length - 2));
    }

    export function triangleMomentOfInertia(a: Vector2, b: Vector2, c: Vector2, axis: Vector2): number {
        const centroid = triangleCentroid(a, b, c);
        const base = v2.length(v2.subtract(b, c));

        const aOnBC = v2.add(b, v2.project(v2.subtract(a, b), v2.subtract(c, b)));
        const height = v2.length(v2.subtract(a, aOnBC));
        const semibase = v2.length(v2.subtract(aOnBC, b));

        // parallel axis theorem factor
        const parallelAxisFactor = v2.lengthSquared(v2.subtract(axis, centroid));

        return (base * base
                - base * semibase
                + semibase * semibase
                + height * height) / 18 + parallelAxisFactor;
    }

    export function triangleArea(a: Vector2, b: Vector2, c: Vector2): number {
        const centroid = triangleCentroid(a, b, c);
        const base = v2.length(v2.subtract(b, c));

        const aOnBC = v2.add(b, v2.project(v2.subtract(a, b), v2.subtract(c, b)));
        const height = v2.length(v2.subtract(a, aOnBC));

        return base * height / 2;
    }

    // assumes that the center of mass is [0, 0]
    export function convexMomentOfInertia(hull: ConvexHull): number {
        var totalMoment: number = 0;
        var totalArea: number = 0;

        const vertices = hull.localVertices();
        
        for (var i = 0; i < vertices.length; ++i) {
            const vertex1 = vertices[i];
            const vertex2 = vertices[(i + 1) % vertices.length];
            const triangleMoment = triangleMomentOfInertia(v2.ZERO, vertex1, vertex2, v2.ZERO);
            const area = triangleArea(v2.ZERO, vertex1, vertex2);
            totalMoment += triangleMoment * area;
            totalArea += area;
        }
        return (totalMoment * hull.actor.mass) / totalArea;
    }

    export function hullContains(hull: ConvexHull, u: Vector2): boolean {
        // convert point to hull space
        const convertedPoint = hull.actor.toLocalSpace(u);
        const vertices = hull.localVertices();

        var hasClockwise = false;
        var hasCounterClockwise = false;

        for (var i = 0; i < vertices.length; i++) {
            const base = vertices[i];
            const tip = vertices[(i + 1) % vertices.length];
            const edge = v2.subtract(tip, base);
            const baseToPoint = v2.subtract(convertedPoint, base);
            if (v2.orientation(edge, baseToPoint) == v2.Orientation.Clockwise) {
                hasClockwise = true;
            }
            else {
                hasCounterClockwise = true;
            }
        }
        return hasClockwise != hasCounterClockwise;
    }
}