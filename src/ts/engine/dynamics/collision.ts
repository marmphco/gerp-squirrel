/// <reference path="../math/vector.ts" />
/// <reference path="./dynamics.ts" />

module GerpSquirrel.Collision {
    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Actor = GerpSquirrel.Dynamics.Actor;

    export function resolveCollision(actor1: Actor, actor2: Actor, normal: Vector2): void {
        const otherAxis = v2.leftOrthogonal(normal);

        const projectedVelocities: [number, number] = [
            v2.projectedLength(Dynamics.actorVelocity(actor1), normal),
            v2.projectedLength(Dynamics.actorVelocity(actor2), normal)
        ];
        const masses: [number, number] = [actor1.mass, actor2.mass];
        
        const newVelocities = solveVelocities(masses, projectedVelocities);
        
        Dynamics.setActorVelocity(actor1, v2.add(
            v2.project(Dynamics.actorVelocity(actor1), otherAxis), 
            v2.scale(normal, newVelocities[0])));

        Dynamics.setActorVelocity(actor2, v2.add(
            v2.project(Dynamics.actorVelocity(actor2), otherAxis),
            v2.scale(normal, newVelocities[1])));
    }

    export function solveVelocities(masses: [number, number], velocities: [number, number]): [number, number] {
        const totalMass = masses[0] + masses[1];
        return [
            (velocities[0] * (masses[0] - masses[1]) + 2 * masses[1] * velocities[1]) / totalMass,
            (velocities[1] * (masses[1] - masses[0]) + 2 * masses[0] * velocities[0]) / totalMass,
        ]
    }
}