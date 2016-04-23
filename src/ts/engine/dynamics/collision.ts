/// <reference path="../math/vector.ts" />
/// <reference path="./dynamics.ts" />

module GerpSquirrel.Collision {
    import v2 = GerpSquirrel.Vector2;
    import dynamics = GerpSquirrel.Dynamics;
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

    export interface CollisionResponder {
        (info: CollisionInfo, actor1: Actor, actor2: Actor): void;
    }

    export interface CollisionInfo {
        positions: [Vector2, Vector2];
        depth: number;
    }

    export function projectOutOfCollision(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        const axis = v2.subtract(info.positions[0], info.positions[1]);
        actor1.setCenter(v2.add(actor1.center(), v2.scale(axis, 0.5)));
        actor2.setCenter(v2.add(actor2.center(), v2.scale(axis, -0.5)));
    }

    export function resolveCollision(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        const axis = v2.subtract(info.positions[0], info.positions[1]);
        actor1._center = v2.add(actor1.center(), v2.scale(axis, 0.5));
        actor2._center = v2.add(actor2.center(), v2.scale(axis, -0.5));
    }

    // TODO define NO_COLLISION instead of returning null. 
    export function hullIntersection(hull0: ConvexHull, hull1: ConvexHull): CollisionInfo {

        const checkProjectionAxes = function(hull: ConvexHull, otherHull: ConvexHull): CollisionInfo {
            var minimumDepthCollision: CollisionInfo = {
                positions: [[0, 0], [0, 0]],
                depth: Number.MAX_VALUE
            };

            const vertices = dynamics.hullVertices(hull);

            for (var i = 0; i < vertices.length; i++) {
                const baseVertex = vertices[i];
                const headVertex = vertices[(i + 1) % vertices.length];
                const edge = v2.subtract(headVertex, baseVertex);
                const edgeNormal = v2.normalize(v2.leftOrthogonal(edge));

                const projectionInfo = dynamics.hullProjected(hull, edgeNormal);
                const projected = projectionInfo[0];

                const otherProjectionInfo = dynamics.hullProjected(otherHull, edgeNormal);
                const otherProjected = otherProjectionInfo[0];

                if (projected[0] > otherProjected[1] || projected[1] < otherProjected[0]) {
                    return null;
                }

                const depthA = otherProjected[1] - projected[0];
                const depthB = projected[1] - otherProjected[0];

                if (depthA < depthB) {
                    if (depthA < minimumDepthCollision.depth) {
                        minimumDepthCollision = {
                            positions: [otherProjectionInfo[2], v2.add(otherProjectionInfo[2], v2.scale(edgeNormal, -depthA))],
                            depth: depthA
                        }
                    }
                }
                else {
                    if (depthB < minimumDepthCollision.depth) {
                        minimumDepthCollision = {
                            positions: [otherProjectionInfo[1], v2.add(otherProjectionInfo[1], v2.scale(edgeNormal, depthB))],
                            depth: depthB
                        }
                    }
                }
            }

            return minimumDepthCollision;
        }

        const minimumDepthCollision0 = checkProjectionAxes(hull0, hull1);
        if (!minimumDepthCollision0) {
            return null;
        }

        const minimumDepthCollision1 = checkProjectionAxes(hull1, hull0);
        if (!minimumDepthCollision1) {
            return null;
        }

        if (minimumDepthCollision0.depth < minimumDepthCollision1.depth) {
            return minimumDepthCollision0;
        }
        else {
            const tmp = minimumDepthCollision1.positions[0];
            minimumDepthCollision1.positions[0] = minimumDepthCollision1.positions[1];
            minimumDepthCollision1.positions[1] = tmp;

            return minimumDepthCollision1;
        }
    }
}