/// <reference path="../math/vector.ts" />
/// <reference path="../math/box.ts" />

module gerpsquirrel.quadtree {

    import v2 = vector2;

    import Vector2 = vector2.Vector2;
    import Box = box.Box;

    export enum Position {
        TopLeft = 0,
        TopRight = 1,
        BottomRight = 2,
        BottomLeft = 3
    }

    export interface Item<Type> {
        bounds: Box;
        data: Type;
    }

    export class QuadTree<Type> {

        private _bounds: Box;
        private _children: Array<QuadTree<Type>>;
        private _items: Array<Item<Type>>;

        private _capacity: number;

        constructor(bounds: Box, capacity: number) {
            this._bounds = bounds;
            this._children = [];
            this._items = [];
            this._capacity = capacity;
        }

        insert(item: Item<Type>) {
            this._items.push(item);

            if (this._items.length > this._capacity || this._children.length > 0) {
                if (this._children.length == 0) {
                    // create child nodes
                    const quarterSize = v2.scale(this._bounds.halfSize, 0.5);
                    const leftCenter = this._bounds.center[0] - quarterSize[0];
                    const rightCenter = this._bounds.center[0] + quarterSize[0];
                    const topCenter = this._bounds.center[1] - quarterSize[1];
                    const bottomCenter = this._bounds.center[1] + quarterSize[1];

                    this._children = [ // do push(...) instead?
                        new QuadTree<Type>(new Box([leftCenter, topCenter], quarterSize), this._capacity),
                        new QuadTree<Type>(new Box([rightCenter, topCenter], quarterSize), this._capacity),
                        new QuadTree<Type>(new Box([rightCenter, bottomCenter], quarterSize), this._capacity),
                        new QuadTree<Type>(new Box([leftCenter, bottomCenter], quarterSize), this._capacity),
                    ];
                }

                // redistribute items to child nodes
                this._items.forEach((item) => {
                    this._children.forEach((childNode) => {
                        if (item.bounds.intersects(childNode._bounds)) {
                            childNode.insert(item);
                        }
                    });
                });

                this._items = [];
            }
        }

        itemsInBox(box: Box): Array<Item<Type>> {

            const topLeftItems = this._children.length > 0 && box.intersects(this._children[Position.TopLeft]._bounds) ?
                this._children[Position.TopLeft].itemsInBox(box) : [];

            const topRightItems = this._children.length > 0 && box.intersects(this._children[Position.TopRight]._bounds) ?
                this._children[Position.TopRight].itemsInBox(box) : [];

            const bottomRightItems = this._children.length > 0 && box.intersects(this._children[Position.BottomRight]._bounds) ?
                this._children[Position.BottomRight].itemsInBox(box) : [];

            const bottomLeftItems = this._children.length > 0 && box.intersects(this._children[Position.BottomLeft]._bounds) ?
                this._children[Position.BottomLeft].itemsInBox(box) : [];

            return this._items.concat(topLeftItems, topRightItems, bottomRightItems, bottomLeftItems);
        }

        allBounds(): Array<Box> {
            const topLeftBounds = this._children.length > 0 ?
                this._children[Position.TopLeft].allBounds() : [];

            const topRightBounds = this._children.length > 0 ?
                this._children[Position.TopRight].allBounds() : [];

            const bottomRightBounds = this._children.length > 0 ?
                this._children[Position.BottomRight].allBounds() : [];

            const bottomLeftBounds = this._children.length > 0 ?
                this._children[Position.BottomLeft].allBounds() : [];

            return [this._bounds].concat(topLeftBounds, topRightBounds, bottomRightBounds, bottomLeftBounds);
        }
    }
}