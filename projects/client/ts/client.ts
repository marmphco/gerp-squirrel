/// <reference path="../../engine/build/dts/gerp-squirrel.d.ts" />

module client {

    import gs = gerpsquirrel;
    import v2 = gerpsquirrel.vector2;
    import render = gerpsquirrel.render;
    import region = gerpsquirrel.region;
    import dynamics = gerpsquirrel.dynamics;
    import collision = gerpsquirrel.collision;

    import Vector2 = v2.Vector2;
    import Box = gerpsquirrel.box.Box;
    import QuadTree = gerpsquirrel.quadtree.QuadTree;
    import MouseInput = gerpsquirrel.input.MouseInput;
    import MouseEventType = gerpsquirrel.input.MouseEventType;
    import RunLoop = gerpsquirrel.runloop.RunLoop;

    import sharedProfiler = gerpsquirrel.profile.sharedProfiler;

    interface ThingRenderInfo {
        vertices: Array<Vector2>;
        center: Vector2;
    }

    var VIRTUAL_TIMESTEP = 30 / 1000;

    class Thing implements render.Renderable<ThingRenderInfo> {
        hull: dynamics.ConvexHull;

        constructor(width: number, height: number, mass: number = 1) {
            this.hull = new dynamics.ConvexHull([
                [0, 0], [width, 0], [width, height], [0, height]
            ]);
            this.hull.actor.mass = mass;
            this.hull.actor.momentOfInertia = dynamics.convexMomentOfInertia(this.hull);
        }

        renderInfo(elapsedTime: number, t: number) {
            return {
                vertices: this.hull.worldVerticesInterpolated(t),
                center: this.hull.actor.centerInterpolated(t)
            }
        }
    }

    function makeRandomThing(bounds: Vector2): Thing {
        const thing: Thing = new Thing(Math.random() * 16 + 4, Math.random() * 16 + 4);
        thing.hull.actor.setCenter([Math.random()*bounds[0], Math.random()*bounds[1]]);
        return thing;
    }

    var _runLoopHandle: number = null;
    var _renderLoop: RunLoop = null;
    export function toggleSimulation() {
        if (_runLoopHandle != null)
        {
            clearInterval(_runLoopHandle);
            _runLoopHandle = null;
        }
        else
        {
            _renderLoop.reset();
            _runLoopHandle = setInterval(() => _renderLoop.run(), 1000 / 60);
        }
    }

    export function init(element: HTMLCanvasElement) {
        const context = element.getContext('2d');
        const renderLoop = new RunLoop(1000 / 30);
        const screenBoundsRegion = region.BoxMake([0, 0], [element.width, element.height]);

        renderLoop.renderStream().handle((_) => {
            context.clearRect(0, 0, element.width, element.height);
        });

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
        renderLoop.renderStream().handle((renderContext) => {

            sharedProfiler().begin("render.things");
            thingRenderer.run(renderContext.elapsedTime, renderContext.t);
            sharedProfiler().end("render.things");

        });

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

        const mouseInput = new MouseInput();
        mouseInput.attachToElement(element);

        var dragging = false;
        var draggedThing = null;
        var startDragOffset: Vector2 = [0, 0];
        var endOfDrag: Vector2 = [0, 0];
        mouseInput.stream()
            .filter((mouseInfo) => mouseInfo.type == MouseEventType.Down)
            .handle((mouseInfo) => {
                things.forEach((thing) => {
                    if (!dragging && dynamics.hullContains(thing.hull, mouseInfo.position)) {
                        dragging = true;
                        draggedThing = thing;
                        startDragOffset = thing.hull.actor.toLocalSpace(mouseInfo.position);
                        endOfDrag = mouseInfo.position;
                    }
                });
            });

        mouseInput.stream()
            .filter((mouseInfo) => mouseInfo.type == MouseEventType.Up)
            .handle((mouseInfo) => {
                dragging = false;
            });

        mouseInput.stream()
            .filter((mouseInfo) => mouseInfo.type == MouseEventType.Move)
            .handle((mouseInfo) => {
                if (dragging) {
                    endOfDrag = mouseInfo.position;
                }
            });

        var collisionInfo: collision.CollisionInfo = null;
        var thingCollisionTree: QuadTree<Thing> = null;
        var totalThingCenter: Vector2;
        var totalThingHalfSize: Vector2;
        var updateStepProfileResults = null;
        renderLoop.updateStream().handle((_) => {
            sharedProfiler().begin("everything");
            sharedProfiler().begin("simulation.integration");

            things.forEach((thing) => {
                thing.hull.actor.advance(VIRTUAL_TIMESTEP);
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

            sharedProfiler().begin("collision.treeGeneration");
            thingCollisionTree = new QuadTree<Thing>(new Box(totalThingCenter, totalThingHalfSize), 5);

            things.forEach((thing) => {
                thingCollisionTree.insert({
                    bounds: thing.hull.worldBounds(),
                    data: thing
                });
            });

            sharedProfiler().end("collision.treeGeneration");

            sharedProfiler().begin("collision.walls");
            walls.forEach((wall) => {
                thingCollisionTree.itemsInBox(wall.hull.worldBounds()).forEach((item) => {
                    const thing = item.data;
                    if (!thing.hull.worldBounds().intersects(wall.hull.worldBounds())) {
                        return;
                    }

                    var collisionData = collision.hullIntersection(wall.hull, thing.hull);
                    if (collisionData) {
                        collision.resolveCollisionFixed(wall.hull.actor, thing.hull.actor, collisionData);
                    }
                });
            });
            sharedProfiler().end("collision.walls");

            sharedProfiler().begin("collision.things");
            thingCollisionTree.forEachPartition((partition) => {
                for (var i = 0; i < partition.length; ++i) {
                    const thing = partition[i].data;

                    for (var j = i + 1; j < partition.length; ++j) {
                        const otherThing = partition[j].data;

                        if (!thing.hull.worldBounds().intersects(otherThing.hull.worldBounds())) {
                            continue;
                        }

                        collisionInfo = collision.hullIntersection(thing.hull, otherThing.hull);

                        if (collisionInfo) {
                            collision.resolveCollision(thing.hull.actor, otherThing.hull.actor, collisionInfo);
                        }
                    }
                }
            });

            sharedProfiler().end("collision.things");
            sharedProfiler().end("collision.total");
            sharedProfiler().end("everything");

            updateStepProfileResults = sharedProfiler().results();
            sharedProfiler().clear();

        });

        renderLoop.renderStream().handle((_) => {
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
            if (thingCollisionTree && draggedThing) {
                thingCollisionTree
                    .itemsInBox(draggedThing.hull.worldBounds())
                    .forEach((item) => {
                        const bounds = item.data.hull.worldBounds();
                        context.fillStyle = "rgba(0, 255, 0, 0.2)";
                        context.fillRect(bounds.center[0] - bounds.halfSize[0],
                                         bounds.center[1] - bounds.halfSize[1],
                                         bounds.halfSize[0] * 2,
                                         bounds.halfSize[1] * 2);
                });

                const draggedThingBounds = draggedThing.hull.worldBounds();
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

            const renderStepProfileResults = sharedProfiler().results();
            sharedProfiler().clear();
            renderProfileResults(renderStepProfileResults, 100, 20);

            if (updateStepProfileResults) {
                renderProfileResults(updateStepProfileResults, 0, 20);
            }
        });

        _renderLoop = renderLoop;
        toggleSimulation();
    }
}
