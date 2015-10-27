/// <reference path="../math/vector.ts" />
/// <reference path="../math/region.ts" />

module GerpSquirrel.Constraint {

    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Region = GerpSquirrel.Region.Region;

    export function vectorConstrainedToRegion(u: Vector2, r: Region): Vector2 {
        if (r.containsVector(u)) {
            return 
        }
    }

}