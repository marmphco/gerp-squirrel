/// <reference path="vector.ts" />

module gerpsquirrel.affinetransform2 {

    import v2 = vector2;
    import Vector2 = vector2.Vector2;

    export class AffineTransform2 {

        // a b tx
        // c d ty
        // 0 0 1
        a: number
        b: number
        c: number
        d: number
        tx: number
        ty: number

        constructor(a: number, b: number, c: number, d: number, tx: number, ty: number) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }

        static withRotation(radians: number): AffineTransform2 {
            return new AffineTransform2(Math.cos(radians),
                                        -Math.sin(radians),
                                        Math.sin(radians),
                                        Math.cos(radians),
                                        0,
                                        0);
        }

        static withScale(scale: Vector2): AffineTransform2 {
            return new AffineTransform2(scale[0],
                                        0,
                                        0,
                                        scale[1],
                                        0,
                                        0);
        }

        static withTranslation(translation: Vector2): AffineTransform2 {
            return new AffineTransform2(1,
                                        0,
                                        0,
                                        1,
                                        translation[0],
                                        translation[1]);
        }

        // returns that * this
        concat(that: AffineTransform2): AffineTransform2 {
            return new AffineTransform2(that.a * this.a + that.b * this.c,
                                        that.a * this.b + that.b * this.d,
                                        that.c * this.a + that.d * this.c,
                                        that.c * this.b + that.d * this.d,
                                        that.a * this.tx + that.b * this.ty + that.tx,
                                        that.c * this.tx + that.d * this.ty + that.ty)
        }

        // returns this * v
        transform(v: Vector2): Vector2 {
            return [
                this.a * v[0] + this.b * v[1] + this.tx,
                this.c * v[0] + this.d * v[1] + this.ty
            ];
        }
    }
}
