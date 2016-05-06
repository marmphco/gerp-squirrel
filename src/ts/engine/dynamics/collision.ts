/// <reference path="../math/vector.ts" />
/// <reference path="./dynamics.ts" />

module gerpsquirrel.collision {
    
    import dynamics = gerpsquirrel.dynamics;
    import v2 = gerpsquirrel.vector2;

    import Actor = dynamics.Actor;
    import ConvexHull = dynamics.ConvexHull;
    import Vector2 = v2.Vector2;

    export class CollisionInfo {
        positions: [Vector2, Vector2];
        depth: number; // magnitude of 

        constructor(positions: [Vector2, Vector2] = [[0, 0], [0, 0]],
                    depth: number = Number.MAX_VALUE) {

            this.positions = positions;
            this.depth = depth;
        }

        isTrivial(): boolean {
            return this.depth < 0.001;
        }

        axis(): Vector2 {
            return v2.subtract(this.positions[0], this.positions[1]);
        }

        normal(): Vector2 {
            return v2.normalize(this.axis());
        }

        tangent(): Vector2 {
            return v2.clockwiseOrthogonal(this.normal());
        }

        reverse(): CollisionInfo {
            return new CollisionInfo([this.positions[1], this.positions[0]],
                                     this.depth);
        }

        toLocalSpace(u: Vector2): Vector2 {
            return [
                v2.projectedLength(u, this.tangent()),
                v2.projectedLength(u, this.normal())
            ];
        }

        fromLocalSpace(u: Vector2): Vector2 {
            return [
                v2.projectedLength(u, this.toLocalSpace([1, 0])),
                v2.projectedLength(u, this.toLocalSpace([0, 1]))
            ];
        }
    }

    export interface CollisionResponder {
        (info: CollisionInfo, actor1: Actor, actor2: Actor): void;
    }

    export function resolveCollisionLinear(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = info.toLocalSpace(actor1.velocityAt(info.positions[0]));
        const localVelocity2 = info.toLocalSpace(actor2.velocityAt(info.positions[1]));

        const relativeVelocity = v2.subtract(localVelocity1, localVelocity2);

        const impulseMagnitude1 = 2 * actor2.mass * (localVelocity2[1] - localVelocity1[1]) / (actor1.mass + actor2.mass);
        const impulseMagnitude2 = 2 * actor1.mass * (localVelocity1[1] - localVelocity2[1]) / (actor1.mass + actor2.mass);

        const impulse1 = v2.scale(info.normal(), impulseMagnitude1);
        const impulse2 = v2.scale(info.normal(), impulseMagnitude2);

        // project out of collision
        const axis = info.axis();

        // TODO this 0.5 needs to be weighted by mass also
        actor1.setCenter(v2.add(actor1.center(), v2.scale(axis, 0.5)));
        actor2.setCenter(v2.add(actor2.center(), v2.scale(axis, -0.5)));

        // apply impulses
        actor1.applyImpulse(info.positions[0], impulse1);
        actor2.applyImpulse(info.positions[1], impulse2);
    }

    export function resolveCollision(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        const energyBefore = actor1.energy() + actor2.energy();

        const axis = info.axis();
        const normal = info.normal();

        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = info.toLocalSpace(actor1.velocityAt(info.positions[0]));
        const localVelocity2 = info.toLocalSpace(actor2.velocityAt(info.positions[1]));

        const relativeVelocity = v2.subtract(localVelocity1, localVelocity2);

        const r1 = v2.subtract(info.positions[0], actor1.center());
        const r2 = v2.subtract(info.positions[1], actor2.center());

        const massFunction = (1 / actor1.mass + 1 / actor2.mass)
                           + (1 / actor1.momentOfInertia * v2.lengthSquared(r1)) 
                           + (1 / actor2.momentOfInertia * v2.lengthSquared(r2)) 
                           - (1 / actor1.momentOfInertia * v2.dot(r1, normal) * v2.projectedLength(r1, normal)) 
                           - (1 / actor2.momentOfInertia * v2.dot(r2, normal) * v2.projectedLength(r2, normal));

        const restitution = 0.2;

        const impulseMagnitude1 = (restitution + 1) * (localVelocity2[1] - localVelocity1[1]) / massFunction;
        const impulseMagnitude2 = (restitution + 1) * (localVelocity1[1] - localVelocity2[1]) / massFunction;

        const impulse1 = v2.scale(normal, impulseMagnitude1);
        const impulse2 = v2.scale(normal, impulseMagnitude2);

        // project out of collision

        // TODO this 0.5 needs to be weighted by mass also
        actor1.setCenter(v2.add(actor1.center(), v2.scale(axis, 0.5)));
        actor2.setCenter(v2.add(actor2.center(), v2.scale(axis, -0.5)));

        // apply impulses
        actor1.applyImpulse(info.positions[0], impulse1);
        actor2.applyImpulse(info.positions[1], impulse2);

        if (isNaN(actor1.energy() + actor2.energy() - energyBefore)) {
            debugger;
        }

        console.log("energyDelta", actor1.energy() + actor2.energy() - energyBefore);
    }

    // resolveCollision with fixedActor.mass => infinity
    export function resolveCollisionFixed(fixedActor: Actor, actor: Actor, info: CollisionInfo) {
        const energyBefore = fixedActor.energy() + actor.energy();

        const axis = info.axis();
        const normal = info.normal();

        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = info.toLocalSpace(fixedActor.velocityAt(info.positions[0]));
        const localVelocity2 = info.toLocalSpace(actor.velocityAt(info.positions[1]));

        const relativeVelocity = v2.subtract(localVelocity1, localVelocity2);

        const r1 = v2.subtract(info.positions[0], fixedActor.center());
        const r2 = v2.subtract(info.positions[1], actor.center());

        const massFunction = (1 / actor.mass)
            + (1 / actor.momentOfInertia * v2.lengthSquared(r2))
            - (1 / actor.momentOfInertia * v2.dot(r2, normal) * v2.projectedLength(r2, normal));

        const restitution = 0.2;
        const impulseMagnitude2 = (restitution + 1) * (localVelocity1[1] - localVelocity2[1]) / massFunction;
        const impulse2 = v2.scale(normal, impulseMagnitude2);

        // project out of collision
        actor.setCenter(v2.add(actor.center(), v2.scale(axis, -1.0)));

        // apply impulses
        actor.applyImpulse(info.positions[1], impulse2);

        console.log("energyDelta", fixedActor.energy() + actor.energy() - energyBefore);
    }

    export function inaccurateResolve(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        const axis = info.axis();
        actor1._center = v2.add(actor1.center(), v2.scale(axis, 0.5));
        actor2._center = v2.add(actor2.center(), v2.scale(axis, -0.5));
    }

    // TODO define NO_COLLISION instead of returning null. 
    export function hullIntersection(hull0: ConvexHull, hull1: ConvexHull): CollisionInfo {

        const checkProjectionAxes = function(hull: ConvexHull, otherHull: ConvexHull): CollisionInfo {
            var minimumDepthCollision: CollisionInfo = new CollisionInfo();

            const vertices = dynamics.hullVertices(hull);

            for (var i = 0; i < vertices.length; i++) {
                const baseVertex = vertices[i];
                const headVertex = vertices[(i + 1) % vertices.length];
                const edge = v2.subtract(headVertex, baseVertex);
                const edgeNormal = v2.normalize(v2.counterClockwiseOrthogonal(edge));

                const projectionInfo = dynamics.hullProjected(hull, edgeNormal);
                const projected = projectionInfo[0];

                const otherProjectionInfo = dynamics.hullProjected(otherHull, edgeNormal);
                const otherProjected = otherProjectionInfo[0];

                if (projected[0] >= otherProjected[1] || projected[1] <= otherProjected[0]) {
                    return null;
                }

                const depthA = otherProjected[1] - projected[0];
                const depthB = projected[1] - otherProjected[0];

                if (depthA < depthB) {
                    if (depthA < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo[2], 
                            v2.add(otherProjectionInfo[2], v2.scale(edgeNormal, -depthA))
                        ];
                        minimumDepthCollision = new CollisionInfo(positions, depthA);
                    }
                }
                else {
                    if (depthB < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo[1],
                            v2.add(otherProjectionInfo[1], v2.scale(edgeNormal, depthB))
                        ];
                        minimumDepthCollision = new CollisionInfo(positions, depthB);
                    }
                }
            }

            if (minimumDepthCollision.isTrivial()) {
                return null;
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
            return minimumDepthCollision1.reverse();
        }
    }
}