/// <reference path="../math/vector.ts" />
/// <reference path="../math/region.ts" />

/*
module GerpSquirrel.Constraint {

    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Region = GerpSquirrel.Region.Region;

    export function vectorConstrainedToRegion(u: Vector2, r: Region): Vector2 {
        if (r.containsVector(u)) {
            return u;
        } else {
        	return r.nearestBoundaryVectorToVector(u);
        }
    }

    export function vectorConstrainedToRegionComplement(u: Vector2, r: Region): Vector2 {
    	if (r.containsVector(u)) {
            return r.nearestBoundaryVectorToVector(u);
        } else {
        	return u;
        }
    }

    export function vectorConstrainedToBoundary(u: Vector2, r: Region): Vector2 {
    	return r.nearestBoundaryVectorToVector(u);
    }

}*/