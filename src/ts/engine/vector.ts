module GerpSquirrel {
    export class Vector2 {
        x: number;
        y: number;

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        add(v: Vector2) {
            return new Vector2(this.x + v.x, this.y + v.y);
        }

        subtract(v: Vector2) {
            return new Vector2(this.x - v.x, this.y - v.y);
        }

        dot(v: Vector2) {
            return this.x * v.x + this.y * v.y;
        }

        scale(a: number) {
            return new Vector2(a * this.x, a * this.y);
        }
    }
}