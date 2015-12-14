/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/math/constraint.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../engine/dynamics/collision.ts" />
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

    interface CircleRenderInfo {
        position: v2.Vector2;
        radius: number;
    }

    class Circle implements render.Renderable<CircleRenderInfo>, dynamics.Actor {
        position: v2.Vector2;
        velocity: v2.Vector2;
        acceleration: v2.Vector2;
        mass: number;
        radius: number;

        constructor() {
            this.position = [Math.random() * 400, Math.random() * 400];
            this.velocity = [Math.random() * 2 + 2, Math.random() * 2 + 2];
            this.acceleration = [0, 0];
            this.mass = 1;
            this.radius = 100;
        }

        renderInfo(timeIntoFrame: number) {
            return {
                position: this.position,//v2.add(this.position, v2.scale(this.velocity, timeIntoFrame)),
                radius: this.radius
            }
        }
    }

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');
        const renderLoop = gs.RunLoopMake(1000 / 20);
        const mouseInput = GerpSquirrel.Input.MouseInputMake();
        mouseInput.attachToElement(element);

        const renderer = render.Canvas2DRendererMake(context, (context, item: CircleRenderInfo) => {
            context.beginPath();
            context.arc(item.position[0], item.position[1], item.radius, 0, Math.PI * 2);
            context.stroke();
        });

        renderLoop.scheduleRenderFunction((_) => {
            context.clearRect(0, 0, element.width, element.height);
        }, gs.forever);

        const screenBoundsRegion = region.BoxMake([0, 0], [element.width, element.height]);

        var circles: Array<Circle> = [];
        renderLoop.scheduleUpdateFunction(() => {
            var circle: Circle = new Circle();
            renderer.addItem(circle);
            circles.push(circle);

            renderLoop.scheduleUpdateFunction(() => {
                dynamics.update(circle);
                constraint.constrainToRegion(circle, screenBoundsRegion);
            }, gs.forever);
                
        }, gs.repeat(5));

        renderLoop.scheduleUpdateFunction(() => {
            circles.forEach((circle: Circle) => {
                circles.forEach((otherCircle: Circle) => {

                    if (circle == otherCircle) return;

                    const connector = v2.subtract(circle.position, otherCircle.position);

                    const diff = (circle.radius + otherCircle.radius) - v2.length(connector);
                    if (diff >= 0) {
                        const normal: Vector2 = v2.normalize(connector);

                        circle.position = v2.add(
                            circle.position, 
                            v2.scale(normal, diff / 2));
                        otherCircle.position = v2.add(
                            otherCircle.position,
                            v2.scale(normal, -diff / 2));

                        collision.resolveCollision(circle, otherCircle, normal);
                    }
                });
            });
        }, gs.forever);
            
        renderLoop.scheduleRenderFunction(renderer.run, gs.forever);

        setInterval(renderLoop.run, 1000 / 20);
    }
}
