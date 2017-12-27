/// <reference path="box.ts" />
/// <reference path="polygon.ts" />
/// <reference path="vector.ts" />
/// <reference path="shape.ts" />

module gerpsquirrel.circle {

    import v2 = vector2

    import Box = box.Box
    import ConvexPolygon = polygon.ConvexPolygon
    import Shape = shape.Shape
    import ShapeProjection = shape.ShapeProjection
    import Vector2 = vector2.Vector2

     export class Circle implements Shape {
        private _centroid: Vector2
        private _radius: number

        constructor(center: Vector2, radius: number) {
            this._centroid = center;
            this._radius = radius;
        }

        radius(): number {
            return this._radius;
        }

        setCentroid(center: Vector2) {
            this._centroid = center;
        }

        // Shape

        bounds(): Box {
            return Box.withCenterandHalfSize(this._centroid, [this._radius, this._radius]);
        }

        centroid(): Vector2 {
            return this._centroid;
        }

        contains(u: Vector2): boolean {
            return v2.lengthSquared(v2.subtract(u, this._centroid)) < this._radius * this._radius;
        }

        projectionAxes(other: Shape): Vector2[] {
            // crappy, but whatever
            if (other instanceof ConvexPolygon) {
                return other.vertices().map((vertex) => {
                    return v2.normalize(v2.subtract(vertex, this._centroid))
                });
            }
            else if (other instanceof Circle) {
                return [v2.normalize(v2.subtract(other._centroid, this._centroid))];
            }

            return []
        }

        projectedOn(axis: Vector2): ShapeProjection {

            const projectedLength = v2.projectedLength(this._centroid, axis);

            return {
                span: [projectedLength - this._radius, projectedLength + this._radius],
                minPoint: v2.subtract(this._centroid, v2.scale(axis, this._radius)),
                maxPoint: v2.add(this._centroid, v2.scale(axis, this._radius))
            }
        }

        secondMoment(density: number): number {
            return Math.PI / 2 * this._radius * this._radius
        }
    }
}
