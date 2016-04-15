/// <reference path="../math/vector.ts" />

module GerpSquirrel.Dynamics {

    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface Actor {
        position: Vector2;
        velocity: Vector2;
        acceleration: Vector2;
        mass: number;
    }

    // needs runge kutta
    export function update(actor: Actor): void {
        actor.velocity = Vector2.add(actor.velocity, actor.acceleration);
        actor.position = Vector2.add(actor.position, actor.velocity);
        actor.acceleration = Vector2.zero;
    }

    export function applyForce(actor: Actor, force: Vector2): void {
        actor.acceleration = Vector2.add(actor.acceleration, Vector2.scale(force, 1.0 / actor.mass));
    }

    export interface ConvexHull {
        center: Vector2;
        velocity: Vector2;
        acceleration: Vector2;
        mass: number;

        rotation: number;
        angularVelocity: number;
        angularAcceleration: number;
        momentOfInertia: number;

        vertices: Array<Vector2>;
    }

    class _ConvexHull implements ConvexHull {
        center: Vector2;
        velocity: Vector2;
        acceleration: Vector2;
        mass: number;

        rotation: number;
        angularVelocity: number;
        angularAcceleration: number;
        momentOfInertia: number;

        vertices: Array<Vector2>;

        constructor(vertices: Array<Vector2>) {
            this.center = [0, 0];
            this.velocity = [0, 0];
            this.acceleration = [0, 0];

            this.rotation = 0;
            this.angularVelocity = 0;
            this.angularAcceleration = 0;

            // compute center of mass (just the centroid)
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
        hull.velocity = Vector2.add(hull.velocity, v2.scale(hull.acceleration, timestep));
        hull.center = Vector2.add(hull.center, v2.scale(hull.velocity, timestep));
        hull.acceleration = Vector2.zero;

        hull.angularVelocity = hull.angularVelocity + hull.angularAcceleration * timestep;
        hull.rotation = hull.rotation + hull.angularVelocity * timestep;
        hull.angularAcceleration = 0;
    }

    export function hullVertices(hull: ConvexHull): Array<Vector2> {
        return hull.vertices.map((vertex) => fromHullSpace(hull, vertex));
    }

    export function toHullSpace(hull: ConvexHull, u: Vector2): Vector2 {
        const translated = v2.subtract(u, hull.center);
        const sin = Math.sin(-hull.rotation);
        const cos = Math.cos(-hull.rotation);
        const rotated: Vector2 = [
            cos * translated[0] + sin * translated[1],
            -sin * translated[0] + cos * translated[1],
        ];
        return rotated;
    }

    export function fromHullSpace(hull: ConvexHull, u: Vector2): Vector2 {
        const sin = Math.sin(hull.rotation);
        const cos = Math.cos(hull.rotation);
        const rotated: Vector2 = [
            cos * u[0] + sin * u[1],
            -sin * u[0] + cos * u[1],
        ];
        return v2.add(hull.center, rotated);
    }

    export function hullContains(hull: ConvexHull, u: Vector2): boolean {
        // convert point to hull space
        const convertedPoint = toHullSpace(hull, u);

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

    export function applyForcetoHull(hull: ConvexHull, from: Vector2, force: Vector2): void {
        const toCenter = v2.subtract(hull.center, from);
        const orthogonalToCenter = v2.leftOrthogonal(toCenter);

        const linearForce = v2.project(force, toCenter);
        const torque = v2.projectedLength(force, orthogonalToCenter) * v2.length(toCenter);
        hull.acceleration = v2.scale(linearForce, 1 / hull.mass);
        hull.angularAcceleration = torque / hull.momentOfInertia;
    }
}