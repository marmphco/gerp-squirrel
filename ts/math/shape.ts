/// <reference path="box.ts" />
/// <reference path="vector.ts" />

module gerpsquirrel.shape {

    import Box = box.Box;
    import Vector2 = vector2.Vector2;

    export interface ShapeProjection {

        //          |`
        //         |    `
        //        |  shape `
        //       |           `
        //       o-------------`o
        //    minpoint       maxpoint
        //       :              :
        //       :              :
        // +-----+--------------+--------> axis
        // 0    min            max

        // The span of the projection along the projection axis [min, max]
        span: Vector2
        // The point on the unprojected shape that corresponds to the min of the projected span
        minPoint: Vector2
        // The point on the unprojected shape that corresponds to the max of the projected span
        maxPoint: Vector2
    }

    export interface Shape {
        bounds(): Box
        centroid(): Vector2
        contains(v: Vector2): boolean

        projectionAxes(other: Shape): Vector2[]
        projectedOn(axis: Vector2): ShapeProjection
    }
}