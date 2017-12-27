/// <reference path="../geom/vector.ts" />
/// <reference path="../geom/intersection.ts" />
/// <reference path="actor.ts" />

module gerpsquirrel.collision {
    
    import dynamics = gerpsquirrel.dynamics;
    import v2 = gerpsquirrel.vector2;

    import Actor = dynamics.Actor;
    import Intersection = intersection.Intersection;
    import Vector2 = v2.Vector2;

    export function resolveCollisionLinear(actor1: Actor, actor2: Actor, intersection: Intersection) {
        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = intersection.toLocalSpace(actor1.velocityAt(intersection.positions[0]));
        const localVelocity2 = intersection.toLocalSpace(actor2.velocityAt(intersection.positions[1]));

        const impulseMagnitude1 = 2 * actor2.mass() * (localVelocity2[1] - localVelocity1[1]) / (actor1.mass() + actor2.mass());
        const impulseMagnitude2 = 2 * actor1.mass() * (localVelocity1[1] - localVelocity2[1]) / (actor1.mass() + actor2.mass());

        const impulse1 = v2.scale(intersection.normal, impulseMagnitude1);
        const impulse2 = v2.scale(intersection.normal, impulseMagnitude2);

        // project out of collision
        const axis = intersection.axis;

        const totalMass = actor1.mass() + actor2.mass();
        const weight1 = actor2.mass() / totalMass;
        const weight2 = actor1.mass() / totalMass;
        actor1.center = v2.add(actor1.center, v2.scale(axis, weight1));
        actor2.center = v2.add(actor2.center, v2.scale(axis, -weight2));

        // apply impulses
        actor1.applyImpulse(intersection.positions[0], impulse1);
        actor2.applyImpulse(intersection.positions[1], impulse2);
    }

    export function impulseMagnitude(actor1: Actor, actor2: Actor, impactPoint: Vector2, axis: Vector2) {
        const r1 = v2.subtract(impactPoint, actor1.center);
        const r2 = v2.subtract(impactPoint, actor2.center);

        const massFunction = (1 / actor1.mass() + 1 / actor2.mass()) * v2.dot(axis, axis)
                           + (1 / actor1.momentOfInertia()) * (v2.lengthSquared(r1) - v2.dot(r1, axis) * v2.dot(r1, axis)) 
                           + (1 / actor2.momentOfInertia()) * (v2.lengthSquared(r2) - v2.dot(r2, axis) * v2.dot(r2, axis)) 

        const impulseMagnitude = (v2.dot(actor2.velocity, axis) 
                                  - v2.dot(actor1.velocity, axis) 
                                  + actor2.angularVelocity * v2.crossLength(axis, r2) 
                                  - actor1.angularVelocity * v2.crossLength(axis, r1)) 
                               / massFunction;

        return impulseMagnitude
    }

    export function resolveCollision(actor1: Actor, actor2: Actor, intersection: Intersection) {

        // project out of collision
        const axis = intersection.axis;
        const totalMass = actor1.mass() + actor2.mass();
        const weight1 = actor2.mass() / totalMass;
        const weight2 = actor1.mass() / totalMass;
        actor1.center = v2.add(actor1.center, v2.scale(axis, weight1));
        actor2.center = v2.add(actor2.center, v2.scale(axis, -weight2));

        // apply normal impulses
        const impactPoint = v2.add(intersection.positions[0], v2.scale(axis, weight1));

        const restitution = 1.0; // this should be a parameter
        const normal = intersection.normal
        const normalImpulseMagnitude = impulseMagnitude(actor1, actor2, impactPoint, normal) 
                                       * (1 + restitution)

        const impulse1Normal = v2.scale(normal, normalImpulseMagnitude)
        const impulse2Normal = v2.scale(normal, -normalImpulseMagnitude)

        actor1.applyImpulse(intersection.positions[0], impulse1Normal)
        actor2.applyImpulse(intersection.positions[1], impulse2Normal)

        // apply tangent impulses (very not physically accurate friction)
        const tangent = intersection.tangent;

        // [0, inf?] determines how strong the "stick" is. 
        // 0 means no stick, inf means a lot of stick
        // should be passed as parameter
        const frictionCoefficient = 1000;

        // proportional to the impulse applied across the collision normal
        const normalCoefficient = Math.abs(normalImpulseMagnitude);

        const tangentImpulseMagnitude = impulseMagnitude(actor1, actor2, impactPoint, tangent) 
                                        * (1 - 1 / (frictionCoefficient * normalCoefficient + 1))

        const impulse1Tangent = v2.scale(tangent, tangentImpulseMagnitude)
        const impulse2Tangent = v2.scale(tangent, -tangentImpulseMagnitude)

        actor1.applyImpulse(intersection.positions[0], impulse1Tangent)
        actor2.applyImpulse(intersection.positions[1], impulse2Tangent)     
    }

    // resolveCollision with fixedActor.mass => infinity
    export function resolveCollisionFixed(fixedActor: Actor, actor: Actor, intersection: Intersection) {
        const axis = intersection.axis;
        const normal = intersection.normal;

        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = intersection.toLocalSpace(fixedActor.velocityAt(intersection.positions[0]));
        const localVelocity2 = intersection.toLocalSpace(actor.velocityAt(intersection.positions[1]));

        const r1 = v2.subtract(intersection.positions[0], fixedActor.center);
        const r2 = v2.subtract(intersection.positions[1], actor.center);

        const massFunction = (1 / actor.mass())
            + (1 / actor.momentOfInertia() * v2.lengthSquared(r2))
            - (1 / actor.momentOfInertia() * v2.dot(r2, normal) * v2.dot(r2, normal));

        const restitution = 1.0;
        const impulseMagnitude2 = (restitution + 1) * (localVelocity1[1] - localVelocity2[1]) / massFunction;
        const impulse2 = v2.scale(normal, impulseMagnitude2);

        // project out of collision
        actor.center = v2.add(actor.center, v2.scale(axis, -1.0));

        // apply impulses
        actor.applyImpulse(intersection.positions[1], impulse2);
    }

    export function inaccurateResolve(actor1: Actor, actor2: Actor, intersection: Intersection) {
        const axis = intersection.axis;
        actor1._center = v2.add(actor1.center, v2.scale(axis, 0.5));
        actor2._center = v2.add(actor2.center, v2.scale(axis, -0.5));
    }
}