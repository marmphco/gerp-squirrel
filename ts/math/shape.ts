/// <reference path="box.ts" />
/// <reference path="vector.ts" />

module gerpsquirrel.shape {

    import Box = box.Box;
    import Vector2 = vector2.Vector2;

    export interface Shape {
        bounds(): Box;
        centroid(): Vector2;
        contains(v: Vector2): boolean;
    }
}