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
}