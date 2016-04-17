/// <reference path="../math/vector.ts" />

module GerpSquirrel.Dynamics {

    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import v2 = GerpSquirrel.Vector2;

    export interface Actor {
        mass: number;
        center: Vector2;
        previousCenter: Vector2;
        acceleration: Vector2;

        momentOfInertia: number;
        orientation: number;
        previousOrientation: number;
        angularAcceleration: number;
    }

    export function updateActor(actor: Actor, timestep: number): void {
        const nextPreviousCenter = actor.center;
        actor.center = v2.add(v2.subtract(v2.scale(actor.center, 2), actor.previousCenter), v2.scale(actor.acceleration, timestep * timestep));
        actor.previousCenter = nextPreviousCenter;
        actor.acceleration = [0, 0];

        const nextPreviousOrientation = actor.orientation;
        actor.orientation = 2 * actor.orientation - actor.previousOrientation + actor.angularAcceleration * timestep * timestep;
        actor.previousOrientation = nextPreviousOrientation;
        actor.angularAcceleration = 0;
    }

    // from is in world space
    export function applyForceToActor(actor: Actor, from: Vector2, force: Vector2): void {
        const fromCenter = v2.subtract(from, actor.center);
        const torque = v2.crossLength(force, fromCenter);

        actor.acceleration = Vector2.add(actor.acceleration, v2.scale(force, 1.0 / actor.mass));
        actor.angularAcceleration = actor.angularAcceleration + torque / actor.momentOfInertia;
    }

    // TODO not accurate
    export function setActorVelocity(actor: Actor, velocity: Vector2): void {
        actor.previousCenter = v2.subtract(actor.center, velocity);
    }

    // TODO not accurate
    export function actorVelocity(actor: Actor): Vector2 {
        return v2.subtract(actor.center, actor.previousCenter);
    }

    export function setActorCenter(actor: Actor, center: Vector2): void {
        actor.center = center;
        actor.previousCenter = center;
    }

    export interface ConvexHull {
        actor: Actor;
        vertices: Array<Vector2>;
    }

    class _ConvexHull implements ConvexHull {
        actor: Actor;
        vertices: Array<Vector2>;

        constructor(vertices: Array<Vector2>) {
            this.actor = {
                mass: 1,
                momentOfInertia: 1,

                center: [0, 0],
                previousCenter: [0, 0],
                acceleration: [0, 0],

                orientation: 0,
                previousOrientation: 0,
                angularAcceleration: 0
            }

            // compute center of mass (just the centroid)
            // TODO this is innaccurate and should be removed later
            // better to approximate by discretely integrating over the area?
            const centerOfMass = v2.scale(vertices.reduce((previousValue, currentValue) => {
                return v2.add(previousValue, currentValue);
            }, [0, 0]), 1/vertices.length);

            this.vertices = vertices.map((vertex) => v2.subtract(vertex, centerOfMass));
        }
    }

    export function ConvexHullMake(vertices: Array<Vector2>): ConvexHull {
        return new _ConvexHull(vertices);
    }

    export function updateHull(hull: ConvexHull, timestep: number): void {
        updateActor(hull.actor, timestep);
    }

    export function hullVertices(hull: ConvexHull): Array<Vector2> {
        return hull.vertices.map((vertex) => fromActorSpace(hull.actor, vertex));
    }

    export function toActorSpace(actor: Actor, u: Vector2): Vector2 {
        const translated = v2.subtract(u, actor.center);
        const sin = Math.sin(-actor.orientation);
        const cos = Math.cos(-actor.orientation);
        const rotated: Vector2 = [
            cos * translated[0] + sin * translated[1],
            -sin * translated[0] + cos * translated[1],
        ];
        return rotated;
    }

    export function fromActorSpace(actor: Actor, u: Vector2): Vector2 {
        const sin = Math.sin(actor.orientation);
        const cos = Math.cos(actor.orientation);
        const rotated: Vector2 = [
            cos * u[0] + sin * u[1],
            -sin * u[0] + cos * u[1],
        ];
        return v2.add(actor.center, rotated);
    }

    export function hullContains(hull: ConvexHull, u: Vector2): boolean {
        // convert point to hull space
        const convertedPoint = toActorSpace(hull.actor, u);

        var hasClockwise = false;
        var hasCounterClockwise = false;

        for (var i = 0; i < hull.vertices.length; i++) {
            const base = hull.vertices[i];
            const tip = hull.vertices[(i + 1) % hull.vertices.length];
            const edge = v2.subtract(tip, base);
            const baseToPoint = v2.subtract(convertedPoint, base);
            if (v2.orientation(edge, baseToPoint) == v2.Orientation.Clockwise) {
                hasClockwise = true;
            }
            else {
                hasCounterClockwise = true;
            }
        }

        return (hasClockwise && !hasCounterClockwise) || (hasCounterClockwise && !hasClockwise);
    }
}