/// <reference path="../math/vector.ts" />
/// <reference path="../dynamics/actor.ts" />

module GerpSquirrel.Dynamics {

    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import v2 = GerpSquirrel.Vector2;

    export interface ConvexHull {
        actor: Actor;
        vertices: Array<Vector2>;
    }

    class _ConvexHull implements ConvexHull {
        actor: Actor;
        vertices: Array<Vector2>;

        constructor(vertices: Array<Vector2>) {
            this.actor = new Actor(1, 1);

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

    export function hullVertices(hull: ConvexHull): Array<Vector2> {
        return hull.vertices.map((vertex) => hull.actor.fromLocalSpace(vertex));
    }

    export function hullProjected(hull: ConvexHull, axis: Vector2): [Vector2, Vector2, Vector2] {
        var projectedSpan: Vector2 = [Number.MAX_VALUE, Number.MIN_VALUE];
        var minVertex: Vector2 = [0, 0];
        var maxVertex: Vector2 = [0, 0];

        const vertices = hullVertices(hull);

        vertices.forEach((vertex) => {
            const projectedVertex = v2.projectedLength(vertex, axis);

            if (projectedVertex < projectedSpan[0]) {
                projectedSpan[0] = projectedVertex;
                minVertex = vertex;
            }
            if (projectedVertex > projectedSpan[1]) {
                projectedSpan[1] = projectedVertex;
                maxVertex = vertex;
            }
        });

        return [projectedSpan, minVertex, maxVertex];
    }

    export function hullContains(hull: ConvexHull, u: Vector2): boolean {
        // convert point to hull space
        const convertedPoint = hull.actor.toLocalSpace(u);

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
        return hasClockwise != hasCounterClockwise;
    }
}