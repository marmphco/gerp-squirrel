module GerpSquirrel.Vector {

    type Vector = Array<number>;

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

module GerpSquirrel.Vector2 {

    export interface Vector2 {
        0: number;
        1: number;
    }

    export const zero: Vector2 = [0, 0];

    export function add(u: Vector2, v: Vector2): Vector2 {
        return [u[0] + v[0], u[1] + v[1]];
    }

    export function subtract(u: Vector2, v: Vector2): Vector2 {
        return [u[0] - v[0], u[1] - v[1]];
    }

    export function dot(u: Vector2, v: Vector2): number {
        return u[0] * v[0] + u[1] * v[1];
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
}