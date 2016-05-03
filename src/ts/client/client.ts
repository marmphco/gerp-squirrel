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

        constructor(size: number, mass: number = 1) {
            this.hull = dynamics.ConvexHullMake([
                [0, 0], [size, 0], [size, size], [0, size]
            ]);
            this.hull.actor.mass = mass;
            this.hull.actor.momentOfInertia = this.hull.actor.mass * (size*size + size*size) / 12;
        }

        renderInfo(timeIntoFrame: number) {
            return {
                vertices: dynamics.hullVertices(this.hull),
                center: this.hull.actor.center()
            }
        }
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

        const thing: Thing = new Thing(100);
        thing.hull.actor.setCenter([300, 300]);
        thing.hull.actor.setOrientation(Math.PI / 4);
        thingRenderer.addItem(thing);

        const other: Thing = new Thing(100);
        other.hull.actor.setCenter([500, 500]);
        other.hull.actor.setOrientation(0.2);
        thingRenderer.addItem(other);

        const walls: Array<Thing> = [
            new Thing(1000, 999999),
            new Thing(1000, 999999),
            new Thing(1000, 999999),
            new Thing(1000, 999999),
        ];
        walls[0].hull.actor.setCenter([element.width / 2, -500]);
        walls[1].hull.actor.setCenter([element.width + 500, element.height / 2]);
        walls[2].hull.actor.setCenter([element.width / 2, element.height + 500]);
        walls[3].hull.actor.setCenter([-500, element.height / 2]);

        renderLoop.scheduleUpdateFunction((timestep) => {
            thing.hull.actor.advance(timestep);
            other.hull.actor.advance(timestep);
        }, gs.forever);

        const mouseInput = gerpsquirrel.input.MouseInputMake();
        mouseInput.attachToElement(element);

        var dragging = false;
        var startDragOffset: Vector2 = [0, 0];
        var endOfDrag: Vector2 = [0, 0];
        mouseInput.downSource().addReceiver((mouseInfo) => {
            if (dynamics.hullContains(thing.hull, mouseInfo.position)) {
                dragging = true;
                startDragOffset = thing.hull.actor.toLocalSpace(mouseInfo.position);
                endOfDrag = mouseInfo.position;
            }
        });
        mouseInput.upSource().addReceiver((mouseInfo) => {
            dragging = false;
        });
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            if (dragging) {
                endOfDrag = mouseInfo.position;
            }
        });

        var collisionInfo: collision.CollisionInfo = null;
        renderLoop.scheduleUpdateFunction(() => {
            if (dragging) {
                const worldSpaceStartOfDrag = thing.hull.actor.fromLocalSpace(startDragOffset);
                const velocityAtPoint = thing.hull.actor.velocityAt(worldSpaceStartOfDrag);
                const force = v2.subtract(v2.scale(v2.subtract(endOfDrag, worldSpaceStartOfDrag), 80.0), v2.scale(velocityAtPoint, 200.0));
                thing.hull.actor.applyForce(worldSpaceStartOfDrag, force);
            }
            collisionInfo = collision.hullIntersection(thing.hull, other.hull);
            if (collisionInfo) {
                collision.resolveCollision(thing.hull.actor, other.hull.actor, collisionInfo);
            }

            walls.forEach((wall) => {
                var collisionData = collision.hullIntersection(wall.hull, thing.hull);
                if (collisionData) {
                    collision.resolveCollision(wall.hull.actor, thing.hull.actor, collisionData);
                }
                collisionData = collision.hullIntersection(wall.hull, other.hull);
                if (collisionData) {
                    collision.resolveCollision(wall.hull.actor, other.hull.actor, collisionData);
                }
            })

        }, gs.forever);

        renderLoop.scheduleRenderFunction((_) => {
            if (dragging) {
                const startOfDrag = thing.hull.actor.fromLocalSpace(startDragOffset);
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
