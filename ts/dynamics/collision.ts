/// <reference path="../geom/shape.ts" />
/// <reference path="../geom/vector.ts" />
/// <reference path="./dynamics.ts" />

module gerpsquirrel.collision {
    
    import dynamics = gerpsquirrel.dynamics;
    import v2 = gerpsquirrel.vector2;

    import Actor = dynamics.Actor;
    import ConvexBody = dynamics.ConvexBody;
    import Shape = shape.Shape;
    import ShapeProjection = shape.ShapeProjection;
    import Vector2 = v2.Vector2;

    export class CollisionInfo {
        positions: [Vector2, Vector2];
        depth: number; // magnitude of 

        constructor(positions: [Vector2, Vector2] = [[0, 0], [0, 0]],
                    depth: number = Number.MAX_VALUE) {

            this.positions = positions;
            this.depth = depth;
        }

        get isTrivial(): boolean {
            return this.depth < 0.001;
        }

        get axis(): Vector2 {
            return v2.subtract(this.positions[0], this.positions[1]);
        }

        get normal(): Vector2 {
            return v2.normalize(this.axis);
        }

        get tangent(): Vector2 {
            return v2.clockwiseOrthogonal(this.normal);
        }

        reverse(): CollisionInfo {
            return new CollisionInfo([this.positions[1], this.positions[0]],
                                     this.depth);
        }

        toLocalSpace(u: Vector2): Vector2 {
            return [
                v2.dot(u, this.tangent),
                v2.dot(u, this.normal)
            ];
        }

        fromLocalSpace(u: Vector2): Vector2 {
            return [
                v2.dot(u, this.toLocalSpace([1, 0])),
                v2.dot(u, this.toLocalSpace([0, 1]))
            ];
        }
    }

    export function resolveCollisionLinear(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = info.toLocalSpace(actor1.velocityAt(info.positions[0]));
        const localVelocity2 = info.toLocalSpace(actor2.velocityAt(info.positions[1]));

        const impulseMagnitude1 = 2 * actor2.mass * (localVelocity2[1] - localVelocity1[1]) / (actor1.mass + actor2.mass);
        const impulseMagnitude2 = 2 * actor1.mass * (localVelocity1[1] - localVelocity2[1]) / (actor1.mass + actor2.mass);

        const impulse1 = v2.scale(info.normal, impulseMagnitude1);
        const impulse2 = v2.scale(info.normal, impulseMagnitude2);

        // project out of collision
        const axis = info.axis;

        const totalMass = actor1.mass + actor2.mass;
        const weight1 = actor2.mass / totalMass;
        const weight2 = actor1.mass / totalMass;
        actor1.center = v2.add(actor1.center, v2.scale(axis, weight1));
        actor2.center = v2.add(actor2.center, v2.scale(axis, -weight2));

        // apply impulses
        actor1.applyImpulse(info.positions[0], impulse1);
        actor2.applyImpulse(info.positions[1], impulse2);
    }

    export function resolveCollision(actor1: Actor, actor2: Actor, info: CollisionInfo) {

        // project out of collision
        const axis = info.axis;
        const totalMass = actor1.mass + actor2.mass;
        const weight1 = actor2.mass / totalMass;
        const weight2 = actor1.mass / totalMass;
        actor1.center = v2.add(actor1.center, v2.scale(axis, weight1));
        actor2.center = v2.add(actor2.center, v2.scale(axis, -weight2));

        // apply impulses
        const impactPoint = v2.add(info.positions[0], v2.scale(axis, weight1));
        const r1 = v2.subtract(impactPoint, actor1.center);
        const r2 = v2.subtract(impactPoint, actor2.center);

        const normal = info.normal;
        const massFunction = (1 / actor1.mass + 1 / actor2.mass) * v2.dot(normal, normal)
                           + (1 / actor1.momentOfInertia) * (v2.lengthSquared(r1) - v2.dot(r1, normal) * v2.dot(r1, normal)) 
                           + (1 / actor2.momentOfInertia) * (v2.lengthSquared(r2) - v2.dot(r2, normal) * v2.dot(r2, normal)) 

        const restitution = 1.0; // this should be a parameter
        const impulseMagnitude1 = (restitution + 1) 
                                * (v2.dot(actor2.velocity, normal) 
                                   - v2.dot(actor1.velocity, normal) 
                                   + actor2.angularVelocity * v2.crossLength(normal, r2) 
                                   - actor1.angularVelocity * v2.crossLength(normal, r1)) 
                                / massFunction;

        const impulse1 = v2.scale(normal, impulseMagnitude1);
        const impulse2 = v2.scale(impulse1, -1);

        actor1.applyImpulse(info.positions[0], impulse1);
        actor2.applyImpulse(info.positions[1], impulse2);
    }

    // resolveCollision with fixedActor.mass => infinity
    export function resolveCollisionFixed(fixedActor: Actor, actor: Actor, info: CollisionInfo) {
        const axis = info.axis;
        const normal = info.normal;

        // TODO these positions may be inaccurate after projection phase...
        const localVelocity1 = info.toLocalSpace(fixedActor.velocityAt(info.positions[0]));
        const localVelocity2 = info.toLocalSpace(actor.velocityAt(info.positions[1]));

        const r1 = v2.subtract(info.positions[0], fixedActor.center);
        const r2 = v2.subtract(info.positions[1], actor.center);

        const massFunction = (1 / actor.mass)
            + (1 / actor.momentOfInertia * v2.lengthSquared(r2))
            - (1 / actor.momentOfInertia * v2.dot(r2, normal) * v2.dot(r2, normal));

        const restitution = 1.0;
        const impulseMagnitude2 = (restitution + 1) * (localVelocity1[1] - localVelocity2[1]) / massFunction;
        const impulse2 = v2.scale(normal, impulseMagnitude2);

        // project out of collision
        actor.center = v2.add(actor.center, v2.scale(axis, -1.0));

        // apply impulses
        actor.applyImpulse(info.positions[1], impulse2);
    }

    export function inaccurateResolve(actor1: Actor, actor2: Actor, info: CollisionInfo) {
        const axis = info.axis;
        actor1._center = v2.add(actor1.center, v2.scale(axis, 0.5));
        actor2._center = v2.add(actor2.center, v2.scale(axis, -0.5));
    }

    export function collisionInfo(shape0: Shape, shape1: Shape): CollisionInfo | null {

        const checkProjectionAxes = function(shape: Shape, otherShape: Shape): CollisionInfo | null {
            var minimumDepthCollision: CollisionInfo = new CollisionInfo();

            const projectionAxes = shape.projectionAxes(otherShape);

            for (var i = 0; i < projectionAxes.length; i++) {
                const projectionAxis = projectionAxes[i];
                const projectionInfo = shape.projectedOn(projectionAxis);
                const span = projectionInfo.span;

                const otherProjectionInfo = otherShape.projectedOn(projectionAxis);
                const otherSpan = otherProjectionInfo.span;

                if (span[0] >= otherSpan[1] || span[1] <= otherSpan[0]) {
                    return null;
                }

                const depthA = otherSpan[1] - span[0];
                const depthB = span[1] - otherSpan[0];

                if (depthA < depthB) {
                    if (depthA < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo.maxPoint, 
                            v2.add(otherProjectionInfo.maxPoint, v2.scale(projectionAxis, -depthA))
                        ];
                        minimumDepthCollision = new CollisionInfo(positions, depthA);
                    }
                }
                else {
                    if (depthB < minimumDepthCollision.depth) {
                        const positions: [Vector2, Vector2] = [
                            otherProjectionInfo.minPoint,
                            v2.add(otherProjectionInfo.minPoint, v2.scale(projectionAxis, depthB))
                        ];
                        minimumDepthCollision = new CollisionInfo(positions, depthB);
                    }
                }
            }

            if (minimumDepthCollision.isTrivial) {
                return null;
            }

            return minimumDepthCollision;
        }

        const minimumDepthCollision0 = checkProjectionAxes(shape0, shape1);
        if (!minimumDepthCollision0) {
            return null;
        }

        const minimumDepthCollision1 = checkProjectionAxes(shape1, shape0);
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