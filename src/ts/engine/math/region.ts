/// <reference path="../math/vector.ts" />

module GerpSquirrel.Region {

    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface Region {
        containsVector(u: Vector2): boolean;
        closestInternalVector(u: Vector2): Vector2;
    }

    export interface Box2 extends Region {
        origin: Vector2;
        size: Vector2;
    }

    export function Box2Make(): Box2 {
        return new _Box2();
    }

    class _Box2 implements Box2 {
        
        constructor() {

        }


    }
}
