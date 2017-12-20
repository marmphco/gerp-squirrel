/// <reference path="../math/shape.ts" />
/// <reference path="../math/vector.ts" />

module gerpsquirrel.dynamics {

    import v2 = gerpsquirrel.vector2;

    import Shape = shape.Shape;
    import Vector2 = v2.Vector2;

    export class Actor {
        mass: number;
        _center: Vector2;
        _previousCenter: Vector2;
        _acceleration: Vector2;

        momentOfInertia: number;
        _orientation: number;
        _previousOrientation: number;
        _angularAcceleration: number;

        constructor(mass: number, momentOfInertia: number) {
            this.mass = mass;
            this.momentOfInertia = momentOfInertia;

            this._center = [0, 0]
            this._previousCenter = [0, 0]
            this._acceleration = [0, 0]

            this._orientation = 0
            this._previousOrientation = 0
            this._angularAcceleration = 0
        }

        // Getters and Setters

        get center(): Vector2 {
            return this._center;
        }

        centerInterpolated(t: number): Vector2 {
            return v2.add(this._center, v2.scale(this.velocity, t));
        }

        set center(center: Vector2) {
            this.setCenter(center);
        }

        protected setCenter(center: Vector2) {
            var velocity = this.velocity;
            this._center = center;
            this.velocity = velocity;
        }

        get velocity(): Vector2 {
            return v2.subtract(this._center, this._previousCenter);
        }

        // point is in world space
        velocityAt(point: Vector2): Vector2 {
            const fromCenter = v2.subtract(point, this._center);
            return v2.add(this.velocity, v2.scale(v2.clockwiseOrthogonal(fromCenter), this.angularVelocity));
        }

        set velocity(velocity: Vector2) {
            this._previousCenter = v2.subtract(this._center, velocity);
        }

        get orientation(): number {
            return this._orientation;
        }

        set orientation(orientation: number) {
            this.setOrientation(orientation);
        }

        protected setOrientation(orientation: number) {
            var angularVelocity = this.angularVelocity;
            this._orientation = orientation;
            this.angularVelocity = angularVelocity;
        }

        get angularVelocity(): number {
            return this._orientation - this._previousOrientation;
        }

        set angularVelocity(angularVelocity: number) {
            this._previousOrientation = this._orientation - angularVelocity;
        }

        get linearEnergy(): number {
            return 0.5 * this.mass * v2.lengthSquared(this.velocity);
        }

        get angularEnergy(): number {
            const angularVelocity = this.angularVelocity;
            return 0.5 * this.momentOfInertia * angularVelocity * angularVelocity;
        }

        get energy(): number {
            return this.linearEnergy + this.angularEnergy;
        }

        shape(): Shape {
            return new shape.Point(this._center);
        }

        // Converting to/from Local Space

        toLocalSpace(u: Vector2): Vector2 {
            const translated = v2.subtract(u, this._center);
            return v2.rotate(translated, -this._orientation)
        }

        fromLocalSpace(u: Vector2): Vector2 {
            const rotated = v2.rotate(u, this._orientation)
            return v2.add(this._center, rotated);
        }

        fromLocalSpaceInterpolated(u: Vector2, t: number): Vector2 {
            const adjustedOrientation = this._orientation + this.angularVelocity * t;
            const sin = Math.sin(adjustedOrientation);
            const cos = Math.cos(adjustedOrientation);
            const rotated: Vector2 = [
                cos * u[0] + sin * u[1],
                -sin * u[0] + cos * u[1],
            ];
            return v2.add(this.centerInterpolated(t), rotated);
        }

        // Dynamics Methods

        advance(timestep: number) {
            const nextPreviousCenter = this._center;
            this._center = v2.by((i) => 2 * this._center[i] - this._previousCenter[i] + this._acceleration[i] * timestep * timestep);
            this._previousCenter = nextPreviousCenter;
            this._acceleration = [0, 0];

            const nextPreviousOrientation = this._orientation;
            this._orientation = 2 * this._orientation - this._previousOrientation + this._angularAcceleration * timestep * timestep;
            this._previousOrientation = nextPreviousOrientation;
            this._angularAcceleration = 0;
        }

        // from and force are in world space
        applyForce(from: Vector2, force: Vector2) {
            const fromCenter = v2.subtract(from, this._center);
            const torque = v2.crossLength(force, fromCenter);

            this._acceleration = v2.add(this._acceleration, v2.scale(force, 1.0 / this.mass));
            this._angularAcceleration = this._angularAcceleration + torque / this.momentOfInertia;
        }

        // from and impulse are in world space
        applyImpulse(from: Vector2, impulse: Vector2) {
            const fromCenter = v2.subtract(from, this._center);
            const angularImpulse = v2.crossLength(impulse, fromCenter);

            this.velocity = v2.add(this.velocity, v2.scale(impulse, 1.0 / this.mass));
            this.angularVelocity = this.angularVelocity + angularImpulse / this.momentOfInertia;
        }
    }
}