/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/math/distance-field-region.ts" />
/// <reference path="../engine/math/constraint.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;
import ev = GerpSquirrel.Event;
import region = GerpSquirrel.Region;
import constraint = GerpSquirrel.Constraint;
import dynamics = GerpSquirrel.Dynamics;

module Client {

    interface RenderInfo {
        position: v2.Vector2;
    }

    class Test implements gs.Interpolatable<RenderInfo>, dynamics.Actor {
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

    function buffer<T>(n: number, f: (element: Array<T>) => void): (T) => void {
        var buffer = [];
        return (element: T) => {
            buffer.push(element);
            if (buffer.length == n) {
                f(buffer);
                buffer = [];
            }
        };
    }

    function rollingWindow<T>(n: number, f: (element: Array<T>) => void): (T) => void {
        var buffer = [];
        return (element: T) => {
            buffer.push(element);
            if (buffer.length == n) {
                f(buffer);
                buffer.shift();
            }
        };
    }

    export function init(element: HTMLCanvasElement) {

        const mouseInput = GerpSquirrel.Input.MouseInputMake();
        mouseInput.attachToElement(element);

        var regionCenter: Vector2 = [0, 0];

        var mouseVector: Vector2 = [0, 0];
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            console.log(mouseInfo.position);
            mouseVector = mouseInfo.position;
            largeCircleRegion.center = mouseVector;
            //circleRegion.center = mouseVector;
            regionCenter = mouseVector;
        });

        var circleRegion = region.DistanceFieldMake((u: Vector2) => {
            return v2.length(v2.subtract(u, regionCenter)) - 80;
        });//region.CircleMake([0, 0], 80);
        var largeCircleRegion = region.CircleMake([0, 0], 240);
        var canvasRegion = region.Box2Make([0, 0], [element.width, element.height]);

        const context = element.getContext('2d');

        const innerRenderer = gs.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillStyle = "#22aabb";
            context.fillRect(item.position[0], item.position[1], 4, 4);
        });
        const outerRenderer = gs.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillStyle = "#dd11bb";
            context.fillRect(item.position[0], item.position[1], 4, 4);
        });

        const renderLoop = gs.RunLoopMake(1000 / 30);

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
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
                constraint.constrainToRegion(item, largeCircleRegion);
                dynamics.applyForce(item, v2.scale(v2.normalize(v2.subtract(mouseVector, item.position)), 0.4));                
                dynamics.applyForce(item, v2.scale(item.velocity, -0.005));                
            }, gs.forever);

            // outer item
            const outerItem = new Test();
            outerRenderer.addItem(outerItem);

            renderLoop.scheduleUpdateFunction(() => {
                dynamics.update(outerItem);
                constraint.constrainToRegionComplement(outerItem, largeCircleRegion);
                constraint.constrainToRegion(outerItem, canvasRegion);
                dynamics.applyForce(outerItem, v2.scale(v2.normalize(v2.subtract(mouseVector, outerItem.position)), 0.4));                
                dynamics.applyForce(outerItem, v2.scale(outerItem.velocity, -0.005));                
            }, gs.forever);

        }, gs.repeat(1000));

        setInterval(renderLoop.run, 1000 / 60);
    }
}
