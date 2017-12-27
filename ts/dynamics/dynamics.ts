/// <reference path="actor.ts" />
/// <reference path="../core/lazy.ts" />
/// <reference path="../geom/vector.ts" />
/// <reference path="../geom/box.ts" />
/// <reference path="../geom/circle.ts" />
/// <reference path="../geom/polygon.ts" />

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

        // override
        shape(): shape.Shape {
            return this._circle;
        }

        circle(): Circle {
            return this._circle;
        }

        circleInterpolated(t: number): Circle {
            return new Circle(this.fromLocalSpaceInterpolated([0, 0], t), this._circle.radius());
        }
    }

    export class ConvexBody extends Actor {
        private _polygon: ConvexPolygon;
        private _worldPolygon: Lazy<ConvexPolygon>;

        constructor(mass: number, vertices: Array<Vector2>) {

            // compute center of mass, assuming uniform mass distribution
            const centerOfMass = polygon.convexCentroid(vertices);
            const shape = new ConvexPolygon(vertices.map((vertex) => v2.subtract(vertex, centerOfMass)));

            super(mass, shape.secondMoment(1) * mass);

            this._polygon = shape;

            this._worldPolygon = new Lazy(() => {
                return new ConvexPolygon(this._polygon.vertices().map((vertex) => this.fromLocalSpace(vertex)));
            })
        }

        // override
        advance(timestep: number) {
            super.advance(timestep)
            this._worldPolygon.markDirty();
        }

        // override
        setCenter(center: Vector2) {
            super.setCenter(center);
            this._worldPolygon.markDirty();
        }

        // override
        setOrientation(orientation: number) {
            super.setOrientation(orientation);
            this._worldPolygon.markDirty();
        }

        shape(): shape.Shape {
            return this._worldPolygon.value();
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
            return new ConvexPolygon(this._polygon.vertices().map((vertex) => {
                return this.fromLocalSpaceInterpolated(vertex, t)
            }));
        }
    }
}