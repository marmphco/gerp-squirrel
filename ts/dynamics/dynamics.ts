/// <reference path="actor.ts" />
/// <reference path="../core/lazy.ts" />
/// <reference path="../math/vector.ts" />
/// <reference path="../math/box.ts" />
/// <reference path="../math/circle.ts" />
/// <reference path="../math/polygon.ts" />

module gerpsquirrel.dynamics {

    import v2 = vector2;
    
    import Box = box.Box;
    import Circle = circle.Circle;
    import ConvexPolygon = polygon.ConvexPolygon;
    import Lazy = lazy.Lazy;
    import Vector2 = vector2.Vector2;

    export class CircleBody extends Actor {
        private _circle: Circle;

        constructor(mass: number, radius: number) {
            super(mass, mass * Math.PI / 2 * radius * radius);

            this._circle = new Circle([0, 0], radius);
        }

        // override
        advance(timestep: number) {
            super.advance(timestep);
            this._circle.setCentroid(this._center);
        }

        // override
        setCenter(center: Vector2) {
            super.setCenter(center);
            this._circle.setCentroid(center);
        }

        circle(): Circle {
            return this._circle;
        }

        worldBounds() {
            return this._circle.bounds();
        }
    }

    export class ConvexBody extends Actor {
        private _polygon: ConvexPolygon;
        private _worldPolygon: Lazy<ConvexPolygon>;

        private _bounds: Lazy<Box>;

        constructor(vertices: Array<Vector2>) {
            super(1, 1);
            this._polygon = new ConvexPolygon(vertices)

            // compute center of mass, assuming uniform mass distribution
            const centerOfMass = this._polygon.centroid();

            this._polygon.vertices = vertices.map((vertex) => v2.subtract(vertex, centerOfMass));

            this._worldPolygon = new Lazy(() => {
                return new ConvexPolygon(this._polygon.vertices.map((vertex) => this.fromLocalSpace(vertex)));
            })

            this._bounds = new Lazy(() => {
                return this.worldPolygon().bounds();
            });
        }

        // override
        advance(timestep: number) {
            super.advance(timestep)
            this._worldPolygon.markDirty();
            this._bounds.markDirty();
        }

        // override
        setCenter(center: Vector2) {
            super.setCenter(center);
            this._worldPolygon.markDirty();
            this._bounds.markDirty();
        }

        // override
        setOrientation(orientation: number) {
            super.setOrientation(orientation);
            this._worldPolygon.markDirty();
            this._bounds.markDirty();
        }

        polygon() {
            return this._polygon;
        }

        // Polygon in world coordinates
        worldPolygon() {
            return this._worldPolygon.value();
        }

        worldPolygonInterpolated(t: number) {
            // cant cache these
            return new ConvexPolygon(this._polygon.vertices.map((vertex) => {
                return this.fromLocalSpaceInterpolated(vertex, t)
            }));
        }

        worldBounds() {
            return this._bounds.value();
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

        const vertices = hull.polygon().vertices;
        
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