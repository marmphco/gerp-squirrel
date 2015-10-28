/// <reference path="../math/vector.ts" />

module GerpSquirrel.Dynamics {

    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface Actor {
        position: Vector2;
        velocity: Vector2;
        acceleration: Vector2;
        mass: number;
    }

    export function update(actor: Actor): void {
        actor.velocity = Vector2.add(actor.velocity, actor.acceleration);
        actor.position = Vector2.add(actor.position, actor.velocity);
        actor.acceleration = Vector2.zero;
    }

    export function applyForce(actor: Actor, force: Vector2): void {
        actor.acceleration = Vector2.add(actor.acceleration, Vector2.scale(force, 1.0 / actor.mass));
    }
}