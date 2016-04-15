/// <reference path="../math/vector.ts" />
/// <reference path="./dynamics.ts" />

module GerpSquirrel.Collision {
    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Actor = GerpSquirrel.Dynamics.Actor;

    export function resolveCollision(actor1: Actor, actor2: Actor, normal: Vector2): void {
        const otherAxis = v2.leftOrthogonal(normal);

        const projectedVelocities: [number, number] = [
            v2.projectedLength(actor1.velocity, normal),
            v2.projectedLength(actor2.velocity, normal)
        ];
        const masses: [number, number] = [actor1.mass, actor2.mass];
        
        const newVelocities = solveVelocities(masses, projectedVelocities);
        
        actor1.velocity = v2.add(
            v2.project(actor1.velocity, otherAxis), 
            v2.scale(normal, newVelocities[0]));

        actor2.velocity = v2.add(
            v2.project(actor2.velocity, otherAxis),
            v2.scale(normal, newVelocities[1]));
    }

    export function solveVelocities(masses: [number, number], velocities: [number, number]): [number, number] {
        const totalMass = masses[0] + masses[1];
        return [
            (velocities[0] * (masses[0] - masses[1]) + 2 * masses[1] * velocities[1]) / totalMass,
            (velocities[1] * (masses[1] - masses[0]) + 2 * masses[0] * velocities[0]) / totalMass,
        ]
    }
}