/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/math/constraint.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;
import ev = GerpSquirrel.Event;
import render = GerpSquirrel.Render;
import region = GerpSquirrel.Region;
import constraint = GerpSquirrel.Constraint;
import dynamics = GerpSquirrel.Dynamics;

module Client {

    interface RenderInfo {
        position: v2.Vector2;
    }

    class Test implements render.Interpolatable<RenderInfo>, dynamics.Actor {
        position: v2.Vector2;
        velocity: v2.Vector2;
        acceleration: v2.Vector2;
        mass: number;

        constructor() {
            this.position = [Math.random() * 100, Math.random() * 100]
            this.velocity = [Math.random() * 2 + 2, Math.random() * 2 + 2]
            this.acceleration = [0, 0];
            this.mass = 1;
        }

        interpolate(timeIntoFrame: number) {
            return {
                position: v2.add(this.position, v2.scale(this.velocity, timeIntoFrame))
            }
        }
    }

    export function init(element: HTMLCanvasElement) {
        const renderLoop = gs.RunLoopMake(1000 / 20);

        const mouseInput = GerpSquirrel.Input.MouseInputMake();
        mouseInput.attachToElement(element);

        var mouseVector: Vector2 = [0, 0];
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            mouseVector = mouseInfo.position;
            largeCircleRegion.center = mouseVector;
            circleRegion.center = mouseVector;
        });

        var boxRegion = region.BoxMake([element.width / 4, element.height / 4], [element.width / 4, element.height / 4]);
        var t = 0;
        renderLoop.scheduleUpdateFunction(() => {
            boxRegion.origin = [
                Math.cos(t) * 50 + element.width / 4,
                Math.sin(t) * 50 + element.height / 4
            ];
            t += 0.1;
        }, gs.forever);
            
        var circleRegion = region.CircleMake([0, 0], 40);
        var largeCircleRegion = region.CircleMake([0, 0], 120);
        var canvasRegion = region.BoxMake([0, 0], [element.width, element.height]);

        var staticRegion = region.union(region.repeat(region.union(
                region.CircleMake([element.width / 2, element.height / 2], 100),
                region.CircleMake([element.width / 4, element.height / 4], 100),
                boxRegion
            ), [100, 50], [400, 300]), 
            largeCircleRegion
        );

        const context = element.getContext('2d');

        const innerRenderer = render.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillStyle = "#22aabb";
            context.fillRect(item.position[0], item.position[1], 4, 4);
        });
        const outerRenderer = render.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillStyle = "#dd11bb";
            context.fillRect(item.position[0], item.position[1], 4, 4);
        });

        mouseInput.clickSource().addReceiver(() => {
            renderLoop.removeAllRenderFunctions();
            renderLoop.removeAllUpdateFunctions(); 
        });

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);

            context.beginPath();
            context.arc(circleRegion.center[0], circleRegion.center[1], circleRegion.radius, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(largeCircleRegion.center[0], largeCircleRegion.center[1], largeCircleRegion.radius, 0, Math.PI * 2);
            context.stroke();

        }, gs.forever);

        renderLoop.scheduleRenderFunction(innerRenderer.run, gs.forever);
        renderLoop.scheduleRenderFunction(outerRenderer.run, gs.forever);

        renderLoop.scheduleUpdateFunction(() => {
            // inner item
            const item = new Test();
            innerRenderer.addItem(item);

            renderLoop.scheduleUpdateFunction(() => {
                dynamics.update(item);
                constraint.constrainToRegionComplement(item, circleRegion);
                constraint.constrainToRegion(item, staticRegion);
                dynamics.applyForce(item, v2.scale(v2.normalize(v2.subtract(mouseVector, item.position)), 0.4));                
                dynamics.applyForce(item, v2.scale(item.velocity, -0.005));                
            }, gs.forever);

            // outer item
            const outerItem = new Test();
            outerRenderer.addItem(outerItem);

            renderLoop.scheduleUpdateFunction(() => {
                dynamics.update(outerItem);
                constraint.constrainToRegionComplement(outerItem, staticRegion);
                constraint.constrainToRegion(outerItem, canvasRegion);
                dynamics.applyForce(outerItem, v2.scale(v2.normalize(v2.subtract(mouseVector, outerItem.position)), 0.4));                
                dynamics.applyForce(outerItem, v2.scale(outerItem.velocity, -0.005));                
            }, gs.forever);

        }, gs.repeat(1000));

        setInterval(renderLoop.run, 1000 / 60);
    }
}
