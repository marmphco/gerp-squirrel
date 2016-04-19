/// <reference path="../math/vector.ts" />
/// <reference path="./dynamics.ts" />

module GerpSquirrel.Collision {
    import v2 = GerpSquirrel.Vector2;
    import Vector2 = GerpSquirrel.Vector2.Vector2;
    import Actor = GerpSquirrel.Dynamics.Actor;
    import ConvexHull = GerpSquirrel.Dynamics.ConvexHull;

    // export function resolveCollision(actor1: Actor, actor2: Actor, normal: Vector2): void {
    //     const otherAxis = v2.leftOrthogonal(normal);

    //     const projectedVelocities: [number, number] = [
    //         v2.projectedLength(actor1.velocity(), normal),
    //         v2.projectedLength(actor2.velocity(), normal)
    //     ];
    //     const masses: [number, number] = [actor1.mass, actor2.mass];
        
    //     const newVelocities = solveVelocities(masses, projectedVelocities);
        
    //     actor1.setVelocity(v2.add(
    //         v2.project(actor1.velocity(), otherAxis), 
    //         v2.scale(normal, newVelocities[0])));

    //     actor2.setVelocity(v2.add(
    //         v2.project(actor2.velocity(), otherAxis),
    //         v2.scale(normal, newVelocities[1])));
    // }

    // export function solveVelocities(masses: [number, number], velocities: [number, number]): [number, number] {
    //     const totalMass = masses[0] + masses[1];
    //     return [
    //         (velocities[0] * (masses[0] - masses[1]) + 2 * masses[1] * velocities[1]) / totalMass,
    //         (velocities[1] * (masses[1] - masses[0]) + 2 * masses[0] * velocities[0]) / totalMass,
    //     ]
    // }

    export interface CollisionInfo {
        position: Vector2;
        normal: Vector2;
        depth: number;
    }

    export function hullIntersection(hull0: ConvexHull, hull1: ConvexHull): CollisionInfo {
        // get world space vertices for both hulls
        // for each edge normal
        //     get projection of both hulls along normal (use arbitrary base point (0, 0)?)
        //     compute overlap
        //     compute collision point is overlapping point on hull that is NOT the normal provider? maybe later
        //     if not overlapping => early out, no collision
        //
        // minimum overlap is collision depth
        var minimumDepthPenetration: CollisionInfo = {
            position: [0, 0],
            normal: [0, 0],
            depth: Number.MAX_VALUE
        };
        const vertices0 = dynamics.hullVertices(hull0);
        const vertices1 = dynamics.hullVertices(hull1);

        for (var i = 0; i < vertices0.length; i++) {
            const baseVertex = vertices0[i];
            const headVertex = vertices0[(i + 1) % vertices0.length];
            const edge = v2.subtract(headVertex, baseVertex);
            const edgeNormal = v2.normalize(v2.leftOrthogonal(edge));

            const projectionInfo0 = dynamics.hullProjected(hull0, edgeNormal);
            const projected0 = projectionInfo0[0];
            const projectionInfo1 = dynamics.hullProjected(hull1, edgeNormal);
            const projected1 = projectionInfo1[0];

            if (projected0[0] > projected1[1] || projected0[1] < projected1[0]) {
                return null
            }

            //const depth = Math.min(projected1[1] - projected0[0], projected0[1] - projected1[0]);

            const depthA = projected1[1] - projected0[0];
            const depthB = projected0[1] - projected1[0];

            if (depthA < depthB) {
                if (depthA < minimumDepthPenetration.depth) {
                    minimumDepthPenetration = {
                        position: projectionInfo1[2],
                        normal: v2.scale(edgeNormal, -1),
                        depth: depthA
                    }
                }
            }
            else {
                if (depthB < minimumDepthPenetration.depth) {
                    minimumDepthPenetration = {
                        position: projectionInfo1[1],
                        normal: edgeNormal,
                        depth: depthB
                    }
                }
            }
        }

        for (var i = 0; i < vertices1.length; i++) {
            const baseVertex = vertices1[i];
            const headVertex = vertices1[(i + 1) % vertices1.length];
            const edge = v2.subtract(headVertex, baseVertex);
            const edgeNormal = v2.normalize(v2.leftOrthogonal(edge));

            const projectionInfo0 = dynamics.hullProjected(hull0, edgeNormal);
            const projected0 = projectionInfo0[0];
            const projectionInfo1 = dynamics.hullProjected(hull1, edgeNormal);
            const projected1 = projectionInfo1[0];

            if (projected0[0] > projected1[1] || projected0[1] < projected1[0]) {
                return null
            }

            const depthA = projected0[1] - projected1[0];
            const depthB = projected1[1] - projected0[0];

            if (depthA < depthB) {
                if (depthA < minimumDepthPenetration.depth) {
                    minimumDepthPenetration = {
                        position: projectionInfo0[2],
                        normal: v2.scale(edgeNormal, -1),
                        depth: depthA
                    }
                }
            }
            else {
                if (depthB < minimumDepthPenetration.depth) {
                    minimumDepthPenetration = {
                        position: projectionInfo0[1],
                        normal: edgeNormal,
                        depth: depthB
                    }
                }
            }
        }

        return minimumDepthPenetration;
    }
}