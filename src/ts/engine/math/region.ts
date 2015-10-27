/// <reference path="../math/vector.ts" />

module GerpSquirrel.Region {

    import Vector2 = GerpSquirrel.Vector2.Vector2;

    export interface Region {
        containsVector(u: Vector2): boolean;
        closestBoundaryVectortoVector(u: Vector2): Vector2;
    }

    export interface Box2 extends Region {
        origin: Vector2;
        size: Vector2;
    }

    export function Box2Make(): Box2 {
        return new _Box2();
    }

    class _Box2 implements Box2 {

        origin: Vector2;
        size: Vector2;

        constructor(origin: Vector2, size: Vector2) {
            this.origin = origin;
            this.size = size;
        }

        containsVector(u: Vector2): boolean {
            const left = this.origin[0];
            const right = this.origin[0] + this.size[0];
            const top = this.origin[1];
            const bottom = this.origin[1] + this.size[1];
            return !(u[0] < left || right < u[0] || u[1] < top || bottom < u[1]);
        }

        closestBoundaryVectortoVector(u: Vector2): Vector2 {
            const left = this.origin[0];
            const right = this.origin[0] + this.size[0];
            const top = this.origin[1];
            const bottom = this.origin[1] + this.size[1];

            if (left <= u[0] && u[0] < right) {
                if (u[1] < top) {
                    return [u[0], top];
                }
                else if (bottom <= u[1]) {
                    return [u[0], bottom];
                }
            }
            else if (top <= u[1] && u[1] < bottom) {
                if (u[0] < left) {
                    return [left, u[1]];
                }
                else if (right <= u[0]) {
                    return [right, u[1]];
                }
            } // corners
            else if (u[0] < left) {
                if (u[1] < top) {
                    return [left, top];
                }
                else if (bottom <= u[1]) {
                    return [left, bottom];
                }
            }
            else if (right <= u[0]) {
                if (u[1] < top) {
                    return [right, top];
                }
                else if (bottom <= u[1]) {
                    return [right, bottom];
                }
            }
            else if (left <= u[0] && u[0] < right && top <= u[1] && u[1] < bottom) {
                const dx = u[0] - (left + right) / 2;
                const dy = u[1] - (top + bottom) / 2;
                if (Math.abs(dx) * this.size[1] < Math.abs(dy) * this.size[0]) {
                    if (dx > 0) {
                        return [right, u[1]];
                    }
                    else {
                        return [left, u[1]];
                    }
                }
                else {
                    if (dy > 0) {
                        return [u[0], top];
                    }
                    else {
                        return [u[0], bottom];
                    }
                }
            }
        }
    }
}
