/// <reference path="box.ts" />
/// <reference path="polygon.ts" />
/// <reference path="vector.ts" />
/// <reference path="shape.ts" />

module gerpsquirrel.point {

    import v2 = vector2

    import Box = box.Box
    import ConvexPolygon = polygon.ConvexPolygon
    import Shape = shape.Shape
    import ShapeProjection = shape.ShapeProjection
    import Vector2 = vector2.Vector2

    export class Point implements Shape {
        private _v: Vector2

        constructor(v: Vector2) {
            this._v = v
        }

        bounds(): Box {
            return new Box(this._v, [0, 0])
        }

        centroid(): Vector2 {
            return this._v
        }

        contains(v: Vector2): boolean {
            return false
        }

        projectionAxes(other: Shape): Vector2[] {
            return [];
        }

        projectedOn(axis: Vector2): ShapeProjection {
            const projectedLength = v2.projectedLength(this._v, axis)
            return {
                span: [projectedLength, projectedLength],
                minPoint: this._v,
                maxPoint: this._v
            }
        }

        secondMoment(density: number): number {
            return density
        }
    }
}
