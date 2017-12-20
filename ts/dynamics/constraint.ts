/// <reference path="../geom/vector.ts" />
/// <reference path="../geom/region.ts" />
/// <reference path="actor.ts" />
/// <reference path="dynamics.ts" />

module gerpsquirrel.constraint {

	import v2 = vector2;

    import Actor = dynamics.Actor;
    import Region = region.Region;
    import Vector2 = v2.Vector2;

    export function constrainToRegion(actor: Actor, r: Region) {
        if (!r.contains(actor.center)) {
        	const newPosition = r.nearestBoundaryPointTo(actor.center);
        	const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center));
        	actor.center = newPosition;
        	actor.velocity = v2.subtract(actor.velocity, v2.scale(v2.project(actor.velocity, moveVector), 2));
        }
    }

    export function constrainToRegionComplement(actor: Actor, r: Region) {
    	if (r.contains(actor.center)) {
            const newPosition = r.nearestBoundaryPointTo(actor.center);
            const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center));
            actor.center = newPosition;
            actor.velocity = v2.subtract(actor.velocity, v2.scale(v2.project(actor.velocity, moveVector), 2));
        }
    }

    export function constrainToBoundary(actor: Actor, r: Region) {
    	const newPosition = r.nearestBoundaryPointTo(actor.center);
    	const moveVector: Vector2 = v2.normalize(v2.subtract(newPosition, actor.center));
    	actor.center = newPosition;
    	actor.velocity = v2.subtract(actor.velocity, v2.scale(v2.project(actor.velocity, moveVector), 2));
    }

}