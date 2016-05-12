/// <reference path="../engine/core/runloop.ts" />
/// <reference path="../engine/core/event.ts" />
/// <reference path="../engine/math/vector.ts" />
/// <reference path="../engine/math/box.ts" />
/// <reference path="../engine/render/render.ts" />
/// <reference path="../engine/input/mouse.ts" />
/// <reference path="../engine/math/region.ts" />
/// <reference path="../engine/dynamics/dynamics.ts" />
/// <reference path="../engine/dynamics/collision.ts" />
/// <reference path="../engine/dynamics/quadtree.ts" />
/// <reference path="../engine/utility/profile.ts" />

module client {

    import gs = gerpsquirrel;
    import v2 = gerpsquirrel.vector2;
    import ev = gerpsquirrel.event;
    import render = gerpsquirrel.render;
    import region = gerpsquirrel.region;
    import dynamics = gerpsquirrel.dynamics;
    import collision = gerpsquirrel.collision;

    import Vector2 = v2.Vector2;
    import Box = gerpsquirrel.box.Box;
    import QuadTree = gerpsquirrel.quadtree.QuadTree;
    import sharedProfiler = gerpsquirrel.profile.sharedProfiler;

    interface ThingRenderInfo {
        vertices: Array<Vector2>;
        center: Vector2;
    }

    class Thing implements render.Renderable<ThingRenderInfo> {
        hull: dynamics.ConvexHull;

        constructor(width: number, height: number, mass: number = 1) {
            this.hull = new dynamics.ConvexHull([
                [0, 0], [width, 0], [width, height], [0, height]
            ]);
            this.hull.actor.mass = mass;
            this.hull.actor.momentOfInertia = dynamics.convexMomentOfInertia(this.hull);
        }

        renderInfo(timeIntoFrame: number) {
            return {
                vertices: this.hull.worldVertices(),
                center: this.hull.actor.center()
            }
        }
    }

    function makeRandomThing(bounds: Vector2): Thing {
        const thing: Thing = new Thing(Math.random() * 16 + 4, Math.random() * 16 + 4);
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

        function renderProfileResults(results: gerpsquirrel.profile.Profile, x: number, y: number) {
            context.font = "10px sans-serif";
            context.fillStyle = "#000000";
            for (var key in results) {
                const entry = results[key];

                if (typeof entry == "number") {
                    context.fillText(key + ": " + entry, x, y);
                    y += 11;
                }
                else {
                    context.fillText(key, x, y);
                    y = renderProfileResults(entry, x + 11, y + 11);
                }
            }
            return y;
        }

        const thingRenderer = render.Canvas2DRendererMake(context, (context, info: ThingRenderInfo) => {
            context.strokeStyle = "#000000";
            context.beginPath();
            context.moveTo(info.vertices[0][0], info.vertices[0][1]);
            for (var i = 1; i < info.vertices.length; i++) {
                const vertex = info.vertices[i];
                context.lineTo(vertex[0], vertex[1]);
            }
            context.lineTo(info.vertices[0][0], info.vertices[0][1]);
            context.stroke();

            context.fillRect(info.center[0] - 2, info.center[1] - 2, 4, 4);
        });
        renderLoop.scheduleRenderFunction(thingRenderer.run, gs.forever);

        var things: Array<Thing> = [];
        for (var i = 0; i < 400; ++i) {
            things.push(makeRandomThing([element.width, element.height]));
        }

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
        });
        mouseInput.moveSource().addReceiver((mouseInfo) => {
            if (dragging) {
                endOfDrag = mouseInfo.position;
            }
        });

        var collisionInfo: collision.CollisionInfo = null;
        var thingBounds: Array<Box> = null;
        var thingCollisionTree: QuadTree<Thing> = null;
        var totalThingCenter: Vector2;
        var totalThingHalfSize: Vector2;
        renderLoop.scheduleUpdateFunction((timestep) => {

            sharedProfiler().begin("simulation.integration");

            things.forEach((thing) => {
                //thing.hull.actor.applyForce(thing.hull.actor.center(), [0, 200]);
                thing.hull.actor.advance(timestep);
            });

            sharedProfiler().end("simulation.integration");
            sharedProfiler().begin("simulation.dragging");

            if (dragging) {
                const worldSpaceStartOfDrag = draggedThing.hull.actor.fromLocalSpace(startDragOffset);
                const velocityAtPoint = draggedThing.hull.actor.velocityAt(worldSpaceStartOfDrag);
                const force = v2.subtract(v2.scale(v2.subtract(endOfDrag, worldSpaceStartOfDrag), 80.0), v2.scale(velocityAtPoint, 200.0));
                draggedThing.hull.actor.applyForce(worldSpaceStartOfDrag, force);
            }

            sharedProfiler().end("simulation.dragging");

            sharedProfiler().begin("collision.total");
            sharedProfiler().begin("collision.boundsCalculation");

            var minX = Number.MAX_VALUE;
            var maxX = Number.MIN_VALUE;
            var minY = Number.MAX_VALUE;
            var maxY = Number.MIN_VALUE;

            thingBounds = things.map((thing) => dynamics.hullBounds(thing.hull));

            things.forEach((thing) => {
                const center = thing.hull.actor.center();
                minX = Math.min(minX, center[0]);
                maxX = Math.max(maxX, center[0]);
                minY = Math.min(minY, center[1]);
                maxY = Math.max(maxY, center[1]);
            });

            totalThingCenter = [(maxX + minX) / 2, (maxY + minY) / 2];
            totalThingHalfSize = [(maxX - minX) / 2, (maxY - minY) / 2];

            sharedProfiler().end("collision.boundsCalculation");
            /*const thingCenter = things
                .map((thing) => {
                    const center = thing.hull.actor.center();
                    minX = Math.min(minX, center[0]);
                    maxX = Math.max(maxX, center[0]);
                    minY = Math.min(minY, center[1]);
                    maxY = Math.max(maxY, center[1]);
                    return center;
                })
                .reduce((totalCenter, currentCenter) => {
                    return v2.add(totalCenter, v2.scale(currentCenter, 1.0 / things.length))
                });*/

            sharedProfiler().begin("collision.treeGeneration");
            thingCollisionTree = new QuadTree<Thing>(new Box(totalThingCenter, totalThingHalfSize), 5);

            things.forEach((thing, i) => {
                thingCollisionTree.insert({
                    bounds: thingBounds[i],
                    data: thing
                });
            })

            sharedProfiler().end("collision.treeGeneration");

            things.forEach((thing, i) => {
                sharedProfiler().begin("collision.walls");
                walls.forEach((wall) => {
                    if (!thingBounds[i].intersects(dynamics.hullBounds(wall.hull))) {
                        return;
                    }

                    var collisionData = collision.hullIntersection(wall.hull, thing.hull);
                    if (collisionData) {
                        collision.resolveCollisionFixed(wall.hull.actor, thing.hull.actor, collisionData);
                    }
                });
                sharedProfiler().end("collision.walls");

                // things.forEach((otherThing) => {
                //     if (thing == otherThing) {
                //         return;
                //     }

                //     collisionInfo = collision.hullIntersection(thing.hull, otherThing.hull);
                //     if (collisionInfo) {
                //         collision.resolveCollision(thing.hull.actor, otherThing.hull.actor, collisionInfo);
                //     }
                // });
                sharedProfiler().begin("collision.things");
                thingCollisionTree.itemsInBox(thingBounds[i]).forEach((item) => {
                    const otherThing = item.data;
                    if (thing == otherThing) {
                        return;
                    }
                    if (!thingBounds[i].intersects(dynamics.hullBounds(otherThing.hull))) {
                        return;
                    }

                    collisionInfo = collision.hullIntersection(thing.hull, otherThing.hull);
                    if (collisionInfo) {
                        collision.resolveCollision(thing.hull.actor, otherThing.hull.actor, collisionInfo);
                    }
                });
                sharedProfiler().end("collision.things");
            });
            sharedProfiler().end("collision.total");

            const results = sharedProfiler().results();
            renderProfileResults(results, 0, 0);
            sharedProfiler().clear();

        }, gs.forever);

        renderLoop.scheduleRenderFunction((_) => {
            if (dragging) {
                const startOfDrag = draggedThing.hull.actor.fromLocalSpace(startDragOffset);
                context.strokeStyle = "#000000";
                context.beginPath();
                context.moveTo(startOfDrag[0], startOfDrag[1]);
                context.lineTo(endOfDrag[0], endOfDrag[1]);
                context.stroke();
            }
            if (collisionInfo) {
                context.strokeStyle = "#000000";
                context.fillStyle = "#ff0000";
                context.fillRect(collisionInfo.positions[0][0], collisionInfo.positions[0][1], 4, 4);
                context.fillStyle = "#00ff00";
                context.fillRect(collisionInfo.positions[1][0], collisionInfo.positions[1][1], 4, 4);
                context.beginPath();
                context.moveTo(collisionInfo.positions[0][0], collisionInfo.positions[0][1]);
                context.lineTo(collisionInfo.positions[1][0], collisionInfo.positions[1][1]);
                context.stroke();
            }
            if (thingBounds && thingCollisionTree && draggedThing) {
                thingCollisionTree
//                    .itemsInBox(new Box([element.width / 4, element.height / 4], [element.width / 4, element.height / 4]))
                    .itemsInBox(dynamics.hullBounds(draggedThing.hull))
                    .forEach((item) => {
                        const bounds = dynamics.hullBounds(item.data.hull);
                        context.fillStyle = "rgba(0, 255, 0, 0.2)";
                        context.fillRect(bounds.center[0] - bounds.halfSize[0],
                                         bounds.center[1] - bounds.halfSize[1],
                                         bounds.halfSize[0] * 2,
                                         bounds.halfSize[1] * 2);
                });

                const draggedThingBounds = dynamics.hullBounds(draggedThing.hull);
                context.fillStyle = "rgba(0, 0, 255, 0.2)";
                context.fillRect(draggedThingBounds.center[0] - draggedThingBounds.halfSize[0],
                    draggedThingBounds.center[1] - draggedThingBounds.halfSize[1],
                    draggedThingBounds.halfSize[0] * 2,
                    draggedThingBounds.halfSize[1] * 2);
            }
            if (thingCollisionTree) {
                thingCollisionTree.allBounds().forEach((bounds) => {
                    context.strokeStyle = "rgba(255, 0, 0, 0.2)";
                    context.strokeRect(bounds.center[0] - bounds.halfSize[0],
                        bounds.center[1] - bounds.halfSize[1],
                        bounds.halfSize[0] * 2,
                        bounds.halfSize[1] * 2);
                });
            }
        }, gs.forever);

        setInterval(renderLoop.run, 1000 / 30);
    }
}
