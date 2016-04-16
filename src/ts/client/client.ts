/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../engine/dynamics/collision.ts" />
/// <reference path="../engine/dynamics/constraint.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;
import ev = GerpSquirrel.Event;
import render = GerpSquirrel.Render;
import region = GerpSquirrel.Region;
import constraint = GerpSquirrel.Constraint;
import dynamics = GerpSquirrel.Dynamics;
import collision = GerpSquirrel.Collision;

module Client {

    interface ThingRenderInfo {
        vertices: Array<v2.Vector2>;
        center: Vector2;
    }

    class Thing implements render.Renderable<ThingRenderInfo> {
        hull: dynamics.ConvexHull;

        constructor(size) {
            this.hull = dynamics.ConvexHullMake([
                [0, 0], [size, 0], [size, size], [0, size]
            ]);
            this.hull.state.mass = 1;
            this.hull.state.momentOfInertia = this.hull.state.mass * (size*size + size*size) / 12;
        }

        renderInfo(timeIntoFrame: number) {
            return {
                vertices: dynamics.hullVertices(this.hull),
                center: this.hull.state.center
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
        thing.hull.state.center = [300, 300];
        thing.hull.state.rotation = 0.3;
        thingRenderer.addItem(thing);
        renderLoop.scheduleUpdateFunction((timestep) => {
            //thing.hull.state.velocity = v2.scale(thing.hull.state.velocity, 0.95);
            //thing.hull.state.angularVelocity = thing.hull.state.angularVelocity * 0.95;
            dynamics.updateHull(thing.hull, timestep);
        }, gs.forever);

        const mouseInput = GerpSquirrel.Input.MouseInputMake();
        mouseInput.attachToElement(element);

        var dragging = false;
        var startDragOffset: Vector2 = [0, 0];
        var endOfDrag: Vector2 = [0, 0];
        mouseInput.downSource().addReceiver((mouseInfo) => {
            if (dynamics.hullContains(thing.hull, mouseInfo.position)) {
                dragging = true;
                startDragOffset = dynamics.toHullSpace(thing.hull.state, mouseInfo.position);
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

        renderLoop.scheduleUpdateFunction(() => {
            if (dragging) {
                dynamics.applyForcetoHull(thing.hull, startDragOffset, endOfDrag, 200.0, 20.0);
            }
           // dynamics.applyForcetoHull(thing.hull, thing.hull.center, [0, 100.0]);
        }, gs.forever);

        renderLoop.scheduleRenderFunction((_) => {
            if (dragging) {
                const startOfDrag = dynamics.fromHullSpace(thing.hull.state, startDragOffset);
                context.beginPath();
                context.moveTo(startOfDrag[0], startOfDrag[1]);
                context.lineTo(endOfDrag[0], endOfDrag[1]);
                context.stroke();
            }
        }, gs.forever);

        setInterval(renderLoop.run, 1000 / 30);
    }
}
