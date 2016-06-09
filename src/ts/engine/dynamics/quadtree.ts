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

    /*
        Only leaf nodes can contain items.
        So each tree can either have children, or items.

        _items.length > 0 => _children.length = 0
        _children.length > 0 => _items.length = 0
        _children.length > 0 => _children.length = 4
    */
    export class QuadTree<Type> {

        private _bounds: Box;
        private _children: Array<QuadTree<Type>>;
        private _items: Array<Item<Type>>;

        // TODO needs depth limit to save the stack
        private _capacity: number;

        constructor(bounds: Box, capacity: number) {
            this._bounds = bounds;
            this._children = [];
            this._items = [];
            this._capacity = capacity;
        }

        insert(item: Item<Type>) {
            this._items.push(item);

            // this._items.length > this._capacity => redistribute if over capacity
            // this._children.length > 0 => redistribute since items must only be placed in leaf nodes
            if (this._items.length > this._capacity || this._children.length > 0) {
                if (this._children.length == 0) {
                    // create child nodes
                    const quarterSize = v2.scale(this._bounds.halfSize, 0.5);
                    const leftCenter = this._bounds.center[0] - quarterSize[0];
                    const rightCenter = this._bounds.center[0] + quarterSize[0];
                    const topCenter = this._bounds.center[1] - quarterSize[1];
                    const bottomCenter = this._bounds.center[1] + quarterSize[1];

                    this._children = [
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
            const hasChildren = this._children.length > 0;

            const topLeftChild = this._children[Position.TopLeft];
            const topRightChild = this._children[Position.TopRight];
            const bottomRightChild = this._children[Position.BottomRight];
            const bottomLeftChild = this._children[Position.BottomLeft];

            const topLeftItems = hasChildren && box.intersects(topLeftChild._bounds) ?
                topLeftChild.itemsInBox(box) : [];

            const topRightItems = hasChildren && box.intersects(topRightChild._bounds) ?
                topRightChild.itemsInBox(box) : [];

            const bottomRightItems = hasChildren && box.intersects(bottomRightChild._bounds) ?
                bottomRightChild.itemsInBox(box) : [];

            const bottomLeftItems = hasChildren && box.intersects(bottomLeftChild._bounds) ?
                bottomLeftChild.itemsInBox(box) : [];

            return this._items.concat(topLeftItems, topRightItems, bottomRightItems, bottomLeftItems);
        }

        forEachPartition(f: (item: Array<Item<Type>>) => void) {
            if (this._items.length > 0) {
                f(this._items);
            }

            this._children.forEach((childNode) => {
                childNode.forEachPartition(f);
            });
        } 

        allBounds(): Array<Box> {
            const hasChildren = this._children.length > 0;

            const topLeftBounds = hasChildren ? this._children[Position.TopLeft].allBounds() : [];
            const topRightBounds = hasChildren? this._children[Position.TopRight].allBounds() : [];
            const bottomRightBounds = hasChildren? this._children[Position.BottomRight].allBounds() : [];
            const bottomLeftBounds = hasChildren? this._children[Position.BottomLeft].allBounds() : [];

            return [this._bounds].concat(topLeftBounds, topRightBounds, bottomRightBounds, bottomLeftBounds);
        }
    }
}