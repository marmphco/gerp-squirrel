/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../engine/dynamics/collision.ts" />

module client {

    import gs = gerpsquirrel;
    import v2 = gerpsquirrel.vector2;
    import ev = gerpsquirrel.event;
    import render = gerpsquirrel.render;
    import region = gerpsquirrel.region;
    import dynamics = gerpsquirrel.dynamics;
    import collision = gerpsquirrel.collision;

    import Vector2 = v2.Vector2;

    interface ThingRenderInfo {
        vertices: Array<Vector2>;
        center: Vector2;
    }

    class Thing implements render.Renderable<ThingRenderInfo> {
        hull: dynamics.ConvexHull;

        constructor(width: number, height: number, mass: number = 1) {
            this.hull = dynamics.ConvexHullMake([
                [0, 0], [width, 0], [width, height], [0, height]
            ]);
            this.hull.actor.mass = mass;
            this.hull.actor.momentOfInertia = dynamics.convexMomentOfInertia(this.hull);
        }

        renderInfo(timeIntoFrame: number) {
            return {
                vertices: dynamics.hullVertices(this.hull),
                center: this.hull.actor.center()
            }
        }
    }

    function makeRandomThing(bounds: Vector2): Thing {
        const thing: Thing = new Thing(Math.random() * 160 + 40, Math.random() * 160 + 40);
        thing.hull.actor.setCenter([Math.random()*bounds[0], Math.random()*bounds[1]]);
        return thing;
    }

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');
        const renderLoop = gs.RunLoopMake(1000 / 30);
        const screenBoundsRegion = region.BoxMake([0, 0], [element.width, element.height]);

        renderLoop.scheduleRenderFunction((_) => {
            context.clearRect(0, 0, element.width, element.height);
        }, gs.forever);

        const thingRenderer = render.Canvas2DRendererMake(context, (context, info: ThingRenderInfo) => {
            context.beginPath();
            context.moveTo(info.vertices[0][0], info.vertices[0][1]);
            for (var i = 1; i < info.vertices.length; i++) {
                const vertex = info.vertices[i];
                context.lineTo(vertex[0], vertex[1]);
            }
            context.lineTo(info.vertices[0][0], info.vertices[0][1]);
            context.stroke();

            context.fillRect(info.center[0], info.center[1], 4, 4);
        });
        renderLoop.scheduleRenderFunction(thingRenderer.run, gs.forever);

        const things: Array<Thing> = [
            //thing, other
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height]),
            makeRandomThing([element.width, element.height])
        ];

        things.forEach((thing) => {
            thingRenderer.addItem(thing);
        })

        const walls: Array<Thing> = [
            new Thing(1000, 1000, 999999),
            new Thing(1000, 1000, 999999),
            new Thing(1000, 1000, 999999),
            new Thing(1000, 1000, 999999),
        ];
        walls[0].hull.actor.setCenter([element.width / 2, -500]);
        walls[1].hull.actor.setCenter([element.width + 500, element.height / 2]);
        walls[2].hull.actor.setCenter([element.width / 2, element.height + 500]);
        walls[3].hull.actor.setCenter([-500, element.height / 2]);

        const mouseInput = gerpsquirrel.input.MouseInputMake();
        mouseInput.attachToElement(element);

        var dragging = false;
        var draggedThing = null;
        var startDragOffset: Vector2 = [0, 0];
        var endOfDrag: Vector2 = [0, 0];
        mouseInput.downSource().addReceiver((mouseInfo) => {
            things.forEach((thing) => {
                if (!dragging && dynamics.hullContains(thing.hull, mouseInfo.position)) {
                    dragging = true;
                    draggedThing = thing;
                    startDragOffset = thing.hull.actor.toLocalSpace(mouseInfo.position);
                    endOfDrag = mouseInfo.position;
                }
            });
        });
        mouseInput.upSource().addReceiver((mouseInfo) => {
            dragging = false;
            draggedThing = null;
        });
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            if (dragging) {
                endOfDrag = mouseInfo.position;
            }
        });

        var collisionInfo: collision.CollisionInfo = null;
        renderLoop.scheduleUpdateFunction((timestep) => {

            things.forEach((thing) => {
                thing.hull.actor.applyForce(thing.hull.actor.center(), [0, 200]);
                thing.hull.actor.advance(timestep);
            });

            if (dragging) {
                const worldSpaceStartOfDrag = draggedThing.hull.actor.fromLocalSpace(startDragOffset);
                const velocityAtPoint = draggedThing.hull.actor.velocityAt(worldSpaceStartOfDrag);
                const force = v2.subtract(v2.scale(v2.subtract(endOfDrag, worldSpaceStartOfDrag), 80.0), v2.scale(velocityAtPoint, 200.0));
                draggedThing.hull.actor.applyForce(worldSpaceStartOfDrag, force);
            }
            things.forEach((thing) => {
                walls.forEach((wall) => {
                    var collisionData = collision.hullIntersection(wall.hull, thing.hull);
                    if (collisionData) {
                        collision.resolveCollisionFixed(wall.hull.actor, thing.hull.actor, collisionData);
                    }
                });
                things.forEach((otherThing) => {
                    if (thing == otherThing) {
                        return;
                    }

                    collisionInfo = collision.hullIntersection(thing.hull, otherThing.hull);
                    if (collisionInfo) {
                        collision.resolveCollision(thing.hull.actor, otherThing.hull.actor, collisionInfo);
                    }
                });
            })
        }, gs.forever);

        renderLoop.scheduleRenderFunction((_) => {
            if (dragging) {
                const startOfDrag = draggedThing.hull.actor.fromLocalSpace(startDragOffset);
                context.beginPath();
                context.moveTo(startOfDrag[0], startOfDrag[1]);
                context.lineTo(endOfDrag[0], endOfDrag[1]);
                context.stroke();
            }
            if (collisionInfo) {
                context.fillStyle = "#ff0000";
                context.fillRect(collisionInfo.positions[0][0], collisionInfo.positions[0][1], 4, 4);
                context.fillStyle = "#00ff00";
                context.fillRect(collisionInfo.positions[1][0], collisionInfo.positions[1][1], 4, 4);
                context.beginPath();
                context.moveTo(collisionInfo.positions[0][0], collisionInfo.positions[0][1]);
                context.lineTo(collisionInfo.positions[1][0], collisionInfo.positions[1][1]);
                context.stroke();
            }
        }, gs.forever);

        setInterval(renderLoop.run, 1000 / 30);
    }
}
