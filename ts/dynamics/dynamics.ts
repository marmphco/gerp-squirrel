/// <reference path="actor.ts" />
/// <reference path="../core/lazy.ts" />
/// <reference path="../math/vector.ts" />
/// <reference path="../math/box.ts" />
/// <reference path="../math/polygon.ts" />

module gerpsquirrel.dynamics {

    import v2 = vector2;
    
    import Box = box.Box;
    import ConvexPolygon = polygon.ConvexPolygon;
    import Lazy = lazy.Lazy;
    import Vector2 = vector2.Vector2;

    export class ConvexBody extends Actor {
        polygon: ConvexPolygon;

        // For caching TODO rename these
        // private _center: Vector2;
        // private _orientation: number;
        // private _cachedWorldVertices: Array<Vector2> | null;
        private _worldVertices: Lazy<Vector2[]>;

        // private _boundsCenter: Vector2;
        // private _boundsOrientation: number;
        // private _cachedBounds: Box | null;
        private _bounds: Lazy<Box>;

        constructor(vertices: Array<Vector2>) {
            super(1, 1);
            this.polygon = new ConvexPolygon(vertices)

            // compute center of mass, assuming uniform mass distribution
            const centerOfMass = this.polygon.centroid();

            this.polygon.vertices = vertices.map((vertex) => v2.subtract(vertex, centerOfMass));

            // Set up caching properties
            // this._center = this.actor.center;
            // this._orientation = this.actor.orientation;
            // this._cachedWorldVertices = null;

            // this._boundsCenter = this.actor.center;
            // this._boundsOrientation = this.actor.orientation;
            // this._cachedBounds = null;
            this._worldVertices = new Lazy(() => {
                return this.polygon.vertices.map((vertex) => this.fromLocalSpace(vertex));
            })

            this._bounds = new Lazy(() => {
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
                return new Box([minX, minY], [maxX - minX, maxY - minY]);
            });
        }

        localVertices() {
            return this.polygon.vertices;
        }

        setCenter(center: Vector2) {
            super.setCenter(center);
            this._worldVertices.markDirty();
            this._bounds.markDirty();
        }

        setOrientation(orientation: number) {
            super.setOrientation(orientation);
            this._worldVertices.markDirty();
            this._bounds.markDirty();
        }

        worldVertices() {
            // if (!this._cachedWorldVertices
            //     || this._center[0] != this.actor.center[0]
            //     || this._center[1] != this.actor.center[1]
            //     || this._orientation != this.actor.orientation) {

            //     this._center = this.actor.center;
            //     this._orientation = this.actor.orientation;
            //     this._cachedWorldVertices = this.polygon.vertices.map((vertex) => this.actor.fromLocalSpace(vertex));
            // }
               
            // return this._cachedWorldVertices;
            return this._worldVertices.value;
        }

        worldVerticesInterpolated(t: number) {
            // cant cache these
            return this.polygon.vertices.map((vertex) => this.fromLocalSpaceInterpolated(vertex, t));
        }

        worldBounds() {
            // if (!this._cachedBounds
            //     || this._boundsCenter[0] != this.actor.center[0]
            //     || this._boundsCenter[1] != this.actor.center[1]
            //     || this._boundsOrientation != this.actor.orientation) {

            //     this._boundsCenter = this.actor.center;
            //     this._boundsOrientation = this.actor.orientation;

            //     var minX = Number.MAX_VALUE;
            //     var maxX = Number.MIN_VALUE;
            //     var minY = Number.MAX_VALUE;
            //     var maxY = Number.MIN_VALUE;

            //     this.worldVertices().forEach((vertex) => {
            //         minX = Math.min(minX, vertex[0]);
            //         maxX = Math.max(maxX, vertex[0]);
            //         minY = Math.min(minY, vertex[1]);
            //         maxY = Math.max(maxY, vertex[1]);
            //     });
            //     this._cachedBounds = new Box([minX, minY], [maxX - minX, maxY - minY]);
            // }
            // return this._cachedBounds;
            return this._bounds.value;
        }

        projectedOn(axis: Vector2): polygon.ProjectionInfo {
            const localAxis = v2.rotate(axis, -this.orientation)
            const localProjected = this.polygon.projectedOn(localAxis)
            const offset = v2.projectedLength(this.center, axis)

            return {
                span:[localProjected.span[0] + offset, localProjected.span[1] + offset],
                minPoint:this.fromLocalSpace(localProjected.minPoint),
                maxPoint:this.fromLocalSpace(localProjected.maxPoint),
            }
        }

        contains(point: Vector2): boolean {
            return this.polygon.contains(this.toLocalSpace(point))
        }
    }

    export function triangleMomentOfInertia(a: Vector2, b: Vector2, c: Vector2, axis: Vector2): number {
        const centroid = polygon.triangleCentroid(a, b, c);
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

    // assumes that the center of mass is [0, 0]
    export function convexMomentOfInertia(hull: ConvexBody): number {
        var totalMoment: number = 0;
        var totalArea: number = 0;

        const vertices = hull.localVertices();
        
        for (var i = 0; i < vertices.length; ++i) {
            const vertex1 = vertices[i];
            const vertex2 = vertices[(i + 1) % vertices.length];
            const triangleMoment = triangleMomentOfInertia(v2.ZERO, vertex1, vertex2, v2.ZERO);
            const area = polygon.triangleArea(v2.ZERO, vertex1, vertex2);
            totalMoment += triangleMoment * area;
            totalArea += area;
        }
        return (totalMoment * hull.mass) / totalArea;
    }
}