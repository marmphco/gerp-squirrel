module gerpsquirrel.vector {

    type Vector = Array<number>;

    export function by(n: number, builder: (i: number) => number): Vector {
        var v = [];
        for (var i = 0; i < n; i++) {
            v[i] = builder(i);
        }
        return v;
    }

    export function add(u: Vector, v: Vector): Vector {
        return u.map((value: number, i: number) => {
            return value + v[i];
        });
    }

    export function subtract(u: Vector, v: Vector): Vector {
        return u.map((value: number, i: number) => {
            return value - v[i];
        });
    }

    export function dot(u: Vector, v: Vector): number {
        return u.reduce((sum: number, value: number, i: number) => {
            return sum + value * v[i];
        }, 0);
    }

    export function scale(u: Vector, scale: number): Vector {
        return u.map((value: number, i: number) => {
            return value * scale;
        });
    }

    export function length(u: Vector): number {
        return Math.sqrt(lengthSquared(u));
    }

    export function lengthSquared(u: Vector): number {
        return u.reduce((sum: number, value: number) => {
            return value * value;
        }, 0);
    }

    export function normalize(u: Vector): Vector {
        return scale(u, 1 / length(u));
    }

    export function project(u: Vector, onto: Vector): Vector {
        return scale(normalize(onto), dot(u, onto) / length(onto));
    }
}

module gerpsquirrel.vector2 {

    export enum Orientation {Clockwise, CounterClockwise}

    export type Vector2 = [number, number];

    export const ZERO: Vector2 = [0, 0];

    export function by(builder: (i: number) => number): Vector2 {
        return [builder(0), builder(1)];
    }

    export function add(u: Vector2, v: Vector2): Vector2 {
        return [u[0] + v[0], u[1] + v[1]];
    }

    export function subtract(u: Vector2, v: Vector2): Vector2 {
        return [u[0] - v[0], u[1] - v[1]];
    }

    export function dot(u: Vector2, v: Vector2): number {
        return u[0] * v[0] + u[1] * v[1];
    }

    export function crossLength(u: Vector2, v: Vector2): number {
        return u[0] * v[1] - u[1] * v[0];
    }

    export function orientation(u: Vector2, v: Vector2): Orientation {
        if (dot(clockwiseOrthogonal(u), v) >= 0) {
            return Orientation.Clockwise;
        }
        else {
            return Orientation.CounterClockwise;
        }
    }

    export function scale(u: Vector2, scale: number): Vector2 {
        return [u[0] * scale, u[1] * scale];
    }

    export function length(u: Vector2): number {
        return Math.sqrt(u[0] * u[0] + u[1] * u[1]);
    }

    export function lengthSquared(u: Vector2): number {
        return u[0] * u[0] + u[1] * u[1];
    }

    export function normalize(u: Vector2): Vector2 {
        return scale(u, 1 / length(u));
    }

    export function project(u: Vector2, onto: Vector2): Vector2 {
        return scale(normalize(onto), dot(u, onto) / length(onto));
    }

    // returns a signed value
    export function projectedLength(u: Vector2, onto: Vector2): number {
        return dot(u, onto) / length(onto);
    }

    export function clockwiseOrthogonal(u: Vector2): Vector2 {
        return [u[1], -u[0]];
    }

    export function counterClockwiseOrthogonal(u: Vector2): Vector2 {
        return [-u[1], u[0]];
    }
}