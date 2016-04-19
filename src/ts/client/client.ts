/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../engine/dynamics/collision.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;
import ev = GerpSquirrel.Event;
import render = GerpSquirrel.Render;
import region = GerpSquirrel.Region;
import dynamics = GerpSquirrel.Dynamics;
import collision = GerpSquirrel.Collision;

module Client {

    interface ThingRenderInfo {
        vertices: Array<Vector2>;
        center: Vector2;
    }

    class Thing implements render.Renderable<ThingRenderInfo> {
        hull: dynamics.ConvexHull;

        constructor(size) {
            this.hull = dynamics.ConvexHullMake([
                [0, 0], [size, 0], [size, size], [0, size]
            ]);
            this.hull.actor.mass = 1;
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
        thing.hull.actor.setOrientation(0.3);
        thingRenderer.addItem(thing);

        const other: Thing = new Thing(100);
        other.hull.actor.setCenter([500, 500]);
        other.hull.actor.setOrientation(0.2);
        thingRenderer.addItem(other);
        renderLoop.scheduleUpdateFunction((timestep) => {
            thing.hull.actor.advance(timestep);
            other.hull.actor.advance(timestep);
        }, gs.forever);

        const mouseInput = GerpSquirrel.Input.MouseInputMake();
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
                console.log("jfdskljsda")
            }
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
                context.fillRect(collisionInfo.position[0], collisionInfo.position[1], 4, 4);
                context.beginPath();
                context.moveTo(collisionInfo.position[0], collisionInfo.position[1]);
                const endPoint = v2.add(v2.scale(collisionInfo.normal, collisionInfo.depth), collisionInfo.position);
                context.lineTo(endPoint[0], endPoint[1]);
                context.stroke();
            }
        }, gs.forever);

        setInterval(renderLoop.run, 1000 / 30);
    }
}
