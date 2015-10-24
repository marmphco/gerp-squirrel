/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../client/gerp.ts" />

import gs = GerpSquirrel;
import v2 = GerpSquirrel.Vector2;
import ev = GerpSquirrel.Event;

module Client {

    interface RenderInfo {
        position: v2.Vector2;
    }

    interface Physical {
        position: v2.Vector2;
        velocity: v2.Vector2;
    }

    class Test implements gs.Interpolatable<RenderInfo>, Physical {
        position: v2.Vector2;
        velocity: v2.Vector2;

        constructor() {
            this.position = [Math.random() * 100, Math.random() * 100]
            this.velocity = [Math.random() * 2 + 2, Math.random() * 2 + 2]
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
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            console.log(mouseInfo.position);
        });
        
        const dispatcher = ev.StreamMake<v2.Vector2>();
        dispatcher.addReceiver(rollingWindow(10, (events) => {
            //console.log(events);
        }));

        const context = element.getContext('2d');

        const renderer = gs.Canvas2DRendererMake(context, function(context, item: RenderInfo) {
            context.fillRect(item.position[0], item.position[1], 20, 20);
        });
        const renderLoop = gs.RunLoopMake(1000 / 30);

        renderLoop.scheduleRenderFunction((timeIntoFrame: number) => {
            context.clearRect(0, 0, element.width, element.height);
        }, gs.forever);

        renderLoop.scheduleRenderFunction(renderer.run, gs.forever);

        renderLoop.scheduleUpdateFunction(() => {
            const item = new Test();
            renderer.addItem(item);
            var life = Math.floor(Math.random() * 400 + 200);
            renderLoop.scheduleUpdateFunction(() => {
                item.position = v2.add(item.position, item.velocity);
                if (item.position[0] > element.width) {
                    item.position[0] = element.width;
                    item.velocity[0] *= -1;
                }
                else if (item.position[0] < 0) {
                    item.position[0] = 0;
                    item.velocity[0] *= -1;
                }
                else if (item.position[1] > element.height) {
                    item.position[1] = element.height;
                    item.velocity[1] *= -1;
                }
                else if (item.position[1] < 0) {
                    item.position[1] = 1;
                    item.velocity[1] *= -1;
                }
                    
            }, () => {
                life--;
                if (life == 16) {
                    dispatcher.publish(item.position);
                    item.velocity = v2.zero;
                }
                return life > 0;
            });
        }, gs.repeat(1000));

        setInterval(renderLoop.run, 1000 / 60);
    }
}
