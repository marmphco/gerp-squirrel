/// <reference path="../math/vector.ts" />

module GerpSquirrel.Dynamics {

    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import v2 = GerpSquirrel.Vector2;

    export interface Actor {
        position: Vector2;
        velocity: Vector2;
        acceleration: Vector2;
        mass: number;
    }

    // needs runge kutta
    export function update(actor: Actor): void {
        //actor.velocity = Vector2.add(actor.velocity, actor.acceleration);
        //actor.position = Vector2.add(actor.position, actor.velocity);

        // RK4 with h=1 for position, linearly interpolate velocity
        // assuming velocity is not position varying
        // v(t, x) = t * v1 + (1 - t) * v0
        const nextVelocity = Vector2.add(actor.velocity, actor.acceleration);

        const v0 = (t: number) => {
            return t * nextVelocity[0] + (1 - t) * actor.velocity[0]
        };

        const v1 = (t: number) => {
            return t * nextVelocity[1] + (1 - t) * actor.velocity[1]
        };

        const k01 = v0(0);
        const k02 = v0(0.5);
        const k03 = v0(0.5);
        const k04 = v0(1.0);

        const k11 = v1(0);
        const k12 = v1(0.5);
        const k13 = v1(0.5);
        const k14 = v1(1.0);

        actor.position[0] += (k01[0] + 2 * k02[0] + 2 * k03[0] + k04[0]) / 6.0;
        actor.position[1] += (k11[1] + 2 * k12[1] + 2 * k13[1] + k14[1]) / 6.0;

        // assume constant acceleration through update
        actor.velocity = nextVelocity;
        actor.acceleration = Vector2.zero;
    }

    export function applyForce(actor: Actor, force: Vector2): void {
        actor.acceleration = Vector2.add(actor.acceleration, Vector2.scale(force, 1.0 / actor.mass));
    }

    export interface SpringForce {
        from: Vector2;
        to: Vector2;
        strength: number;
        damping: number;
    }

    export interface DynamicState {
        center: Vector2;
        velocity: Vector2;
        mass: number;

        rotation: number;
        angularVelocity: number;
        momentOfInertia: number;
    }

    export interface DynamicStateDerivative {
        velocity: Vector2;
        acceleration: Vector2;
        angularVelocity: number;
        angularAcceleration: number;
    }

    export interface ConvexHull {
        state: DynamicState;
        forces: Array<SpringForce>;
        vertices: Array<Vector2>;
    }

    class _ConvexHull implements ConvexHull {
        state: DynamicState;

        forces: Array<SpringForce>;
        vertices: Array<Vector2>;

        constructor(vertices: Array<Vector2>) {
            this.state = {
                center: [0, 0],
                velocity: [0, 0],
                mass: 1,
                rotation: 0,
                angularVelocity: 0,
                momentOfInertia: 1
            }

            this.forces = [];

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

    export function fastRK4(x: number, dx: number, ddx: number, h: number): number {

        const f = (t: number): number => dx + ddx * t;
        const k1 = f(0);
        const k2 = f(0.5 * h);
        const k3 = f(0.5 * h);
        const k4 = f(1.0 * h);

        return x + h * (k1 + 2 * k2 + 2 * k3 + k4) / 6.0;
    }

    export function updateHull(hull: ConvexHull, timestep: number): void {

        const linearAcceleration = (state: DynamicState): Vector2 => {
            return hull.forces.map((force): Vector2 => {

                const worldSpaceFrom = fromHullSpace(state, force.from);
                const linearForce = v2.scale(v2.subtract(force.to, worldSpaceFrom), force.strength);
                const dampedForce = v2.subtract(linearForce, v2.scale(velocityAtPoint(state, force.from), force.damping));
                console.log(linearForce, dampedForce);
                return v2.scale(dampedForce, 1 / state.mass);

            }).reduce((sum: Vector2, acceleration: Vector2) => {
                return v2.add(sum, acceleration);
            }, [0, 200]);
        };

        const angularAcceleration = (state: DynamicState): number => {
            return hull.forces.map((force): number => {

                const worldSpaceFrom = fromHullSpace(state, force.from);
                const fromCenter = v2.subtract(worldSpaceFrom, state.center);
                const linearForce = v2.scale(v2.subtract(force.to, worldSpaceFrom), force.strength);
                const dampedForce = v2.subtract(linearForce, v2.scale(velocityAtPoint(state, force.from), force.damping)); 
                const torque = v2.crossLength(dampedForce, fromCenter);

                return torque / state.momentOfInertia;

            }).reduce((sum: number, acceleration: number) => {
                return sum + acceleration;
            }, 0.0);
        }

        const advanceState = (state: DynamicState, derivative: DynamicStateDerivative, timestep: number): DynamicStateDerivative => {

            const nextState = {
                center: v2.add(state.center, v2.scale(derivative.velocity, timestep)),
                velocity: v2.add(state.velocity, v2.scale(derivative.acceleration, timestep)),
                mass: state.mass,
                rotation: state.rotation + derivative.angularVelocity * timestep,
                angularVelocity: state.angularVelocity + derivative.angularAcceleration * timestep,
                momentOfInertia: state.momentOfInertia
            }

            return {
                velocity: nextState.velocity,
                acceleration: linearAcceleration(nextState),
                angularVelocity: nextState.angularVelocity,
                angularAcceleration: angularAcceleration(nextState),
            };
        }

        const k1 = advanceState(hull.state, {
            velocity: [0, 0],
            acceleration: [0, 0],
            angularVelocity: 0,
            angularAcceleration: 0
        }, 0.0);
        const k2 = advanceState(hull.state, k1, 0.5 * timestep);
        const k3 = advanceState(hull.state, k2, 0.5 * timestep);
        const k4 = advanceState(hull.state, k3, 1.0 * timestep);

        hull.state.center = v2.add(hull.state.center, 
                                   v2.scale(v2.add(k1.velocity, 
                                                   v2.add(v2.scale(k2.velocity, 2), 
                                                          v2.add(v2.scale(k3.velocity, 2),
                                                                 k4.velocity))), 
                                            timestep / 6));
        hull.state.velocity = v2.add(hull.state.velocity,
                                     v2.scale(v2.add(k1.acceleration,
                                                     v2.add(v2.scale(k2.acceleration, 2),
                                                            v2.add(v2.scale(k3.acceleration, 2),
                                                                   k4.acceleration))),
                                              timestep / 6));

        // TODO advance angular state
        hull.state.rotation += (k1.angularVelocity + 2 * k2.angularVelocity + 2 * k3.angularVelocity + k4.angularVelocity) * timestep / 6;
        hull.state.angularVelocity += (k1.angularAcceleration + 2 * k2.angularAcceleration + 2 * k3.angularAcceleration + k4.angularAcceleration) * timestep / 6;

        //clear forces
        hull.forces = [];
    }

    export function hullVertices(hull: ConvexHull): Array<Vector2> {
        return hull.vertices.map((vertex) => fromHullSpace(hull.state, vertex));
    }

    export function toHullSpace(state: DynamicState, u: Vector2): Vector2 {
        const translated = v2.subtract(u, state.center);
        const sin = Math.sin(-state.rotation);
        const cos = Math.cos(-state.rotation);
        const rotated: Vector2 = [
            cos * translated[0] + sin * translated[1],
            -sin * translated[0] + cos * translated[1],
        ];
        return rotated;
    }

    export function fromHullSpace(state: DynamicState, u: Vector2): Vector2 {
        const sin = Math.sin(state.rotation);
        const cos = Math.cos(state.rotation);
        const rotated: Vector2 = [
            cos * u[0] + sin * u[1],
            -sin * u[0] + cos * u[1],
        ];
        return v2.add(state.center, rotated);
    }

    export function velocityAtPoint(state: DynamicState, u: Vector2): Vector2 {

        const worldSpaceU = fromHullSpace(state, u);
        const fromCenter = v2.subtract(worldSpaceU, state.center);
        return v2.add(state.velocity, v2.scale(v2.clockwiseOrthogonal(fromCenter), state.angularVelocity));
    }

    export function hullContains(hull: ConvexHull, u: Vector2): boolean {
        // convert point to hull space
        const convertedPoint = toHullSpace(hull.state, u);

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

    // from is a vector in hull space
    // 
    export function applyForcetoHull(hull: ConvexHull, from: Vector2, to: Vector2, strength: number, damping: number): void {
        hull.forces.push({
            from: from,
            to: to,
            strength: strength,
            damping: damping
        })
    }
}