module gerpsquirrel.event {

    export type HandlerID = number;

    export interface Stream<T> { 
        // Stream Transformations
        map<U>(mapper: (item: T) => U): Stream<U>;
        filter(predicate: (item: T) => boolean): Stream<T>;

        // Handling Streams 
        handle(handler: (item: T) => void): HandlerID;
        removeHandler(handlerID: HandlerID): void;
    }

    type Handler<T> = (item: T) => void;

    function map<T, U>(parent: Stream<T>, mapper: (item: T) => U): ProcessedStream<T, U> {
        return new ProcessedStream(parent, (handler: Handler<U>) => {
            return (item: T) => {
                handler(mapper(item));
            };
        });
    }

    function filter<T>(parent: Stream<T>, predicate: (item: T) => boolean): ProcessedStream<T, T> {
        return new ProcessedStream(parent, (handler: Handler<T>) => {
            return (item: T) => {
                if (predicate(item)) {
                    handler(item);
                }
            };
        });
    }

    export class BaseStream<T> implements Stream<T> {

        private _handlers: Array<Handler<T>>;
        private _currentID: number;

        constructor() {
            this._handlers = [];
            this._currentID = 0;
        }

        generate(handler: (item: T) => void): (item: T) => void {
            return handler;
        }

        map<U>(mapper: (item: T) => U): Stream<U> {
            return map(this, mapper);
        }

        filter(predicate: (item: T) => boolean): Stream<T> {
            return filter(this, predicate);
        }

        handle(handler: (item: T) => void): HandlerID {
            this._handlers[this._currentID] = handler;
            return this._currentID++;
        }

        removeHandler(handlerID: HandlerID): void {
            delete this._handlers[handlerID];
        }

        push(item: T) {
            this._handlers.forEach((handler: Handler<T>) => {
                handler(item);
            });
        }
    }

    class ProcessedStream<InputType, OutputType> implements Stream<OutputType> {

        private _parent: Stream<InputType>;
        private _generator: (handler: Handler<OutputType>) => Handler<InputType>;

        constructor(parent: Stream<InputType>, generator: (handler: Handler<OutputType>) => Handler<InputType>) {
            this._parent = parent;
            this._generator = generator;
        }

        map<U>(mapper: (item: OutputType) => U): ProcessedStream<OutputType, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: OutputType) => boolean): ProcessedStream<OutputType, OutputType> {
            return filter(this, predicate);
        }

        handle(handler: (item: OutputType) => void): HandlerID {
            return this._parent.handle(this._generator(handler));
        }

        removeHandler(handlerID: HandlerID): void {
            this._parent.removeHandler(handlerID);
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
}
