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
        const renderLoop = gs.RunLoopMake(1000 / 30);

        const mouseInput = GerpSquirrel.Input.MouseInputMake();
        mouseInput.attachToElement(element);

        var mouseVector: Vector2 = [0, 0];
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            mouseVector = mouseInfo.position;
            largeCircleRegion.center = mouseVector;
            circleRegion.center = mouseVector;
        });

        var boxRegion = region.Box2Make([element.width / 4, element.height / 4], [element.width / 4, element.height / 4]);
        var t = 0;
        renderLoop.scheduleUpdateFunction(() => {
            boxRegion.origin = [
                Math.cos(t) * 50 + element.width / 4,
                Math.sin(t) * 50 + element.height / 4
            ];
            t += 0.1;
        }, gs.forever);
            
        var staticRegion = region.union(
            region.CircleMake([element.width / 2, element.height / 2], 100),
            region.CircleMake([element.width / 4, element.height / 4], 100),
            boxRegion
        );

        var circleRegion = region.CircleMake([0, 0], 80);
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

        mouseInput.clickSource().addReceiver(() => {
            renderLoop.removeAllRenderFunctions();
            renderLoop.removeAllUpdateFunctions(); 
        });

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
            context.beginPath();
            staticRegion.boundaryPath(20, 20).forEach((u, index, array) => {
                if (index == 0) {
                    context.moveTo(u[0], u[1]);
                }
                else {
                    context.lineTo(u[0], u[1]);
                }
                if (index == array.length - 1) {
                    context.lineTo(array[0][0], array[0][1]);
                }
            });
            context.stroke();

            context.beginPath();
            context.arc(circleRegion.center[0], circleRegion.center[1], circleRegion.radius, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(largeCircleRegion.center[0], largeCircleRegion.center[1], largeCircleRegion.radius, 0, Math.PI * 2);
            context.stroke();


        }, gs.forever);

        renderLoop.scheduleRenderFunction(innerRenderer.run, gs.forever);
        renderLoop.scheduleRenderFunction(outerRenderer.run, gs.forever);

        // renderLoop.scheduleUpdateFunction(() => {
        //     const points = circleRegion.intersect(staticRegion, 40.0);
        //     points.forEach((point) => {
        //         context.fillStyle = "#000000";
        //         context.fillRect(point[0], point[1], 8, 8);
        //     });
        // }, gs.forever);

        renderLoop.scheduleUpdateFunction(() => {
            // inner item
            const item = new Test();
            innerRenderer.addItem(item);

            renderLoop.scheduleUpdateFunction(() => {
                dynamics.update(item);
                constraint.constrainToRegionComplement(item, circleRegion);
                constraint.constrainToRegion(item, staticRegion);
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
                constraint.constrainToRegionComplement(outerItem, staticRegion);
                constraint.constrainToRegion(outerItem, canvasRegion);
                dynamics.applyForce(outerItem, v2.scale(v2.normalize(v2.subtract(mouseVector, outerItem.position)), 0.4));                
                dynamics.applyForce(outerItem, v2.scale(outerItem.velocity, -0.005));                
            }, gs.forever);

        }, gs.repeat(1000));

        setInterval(renderLoop.run, 1000 / 60);
    }
}
