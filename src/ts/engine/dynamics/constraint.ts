/// <reference path="../math/vector.ts" />
/// <reference path="../math/region.ts" />
/// <reference path="../dynamics/dynamics.ts" />

module GerpSquirrel.Constraint {

	import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Region = GerpSquirrel.Region.Region;

    export function constrainToRegion(actor: Dynamics.Actor, r: Region) {
        if (!r.containsVector(actor.center())) {
        	const newPosition = r.nearestBoundaryVectorToVector(actor.center());
        	const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center()));
        	actor.setCenter(newPosition);
        	actor.setVelocity(v2.subtract(actor.velocity(), v2.scale(v2.project(actor.velocity(), moveVector), 2)));
        }
    }

    export function constrainToRegionComplement(actor: Dynamics.Actor, r: Region) {
    	if (r.containsVector(actor.center())) {
            const newPosition = r.nearestBoundaryVectorToVector(actor.center());
            const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center()));
            actor.setCenter(newPosition);
            actor.setVelocity(v2.subtract(actor.velocity(), v2.scale(v2.project(actor.velocity(), moveVector), 2)));
        }
    }

    export function constrainToBoundary(actor: Dynamics.Actor, r: Region) {
    	const newPosition = r.nearestBoundaryVectorToVector(actor.center());
    	const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center()));
    	actor.setCenter(newPosition);
    	actor.setVelocity(v2.subtract(actor.velocity(), v2.scale(v2.project(actor.velocity(), moveVector), 2)));
    }

}