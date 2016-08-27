module gerpsquirrel.event {

    export type HandlerID = number;

    export interface Stream<T> { 
        // Stream Transformations
        map<U>(mapper: (item: T) => U): Stream<U>;
        filter(predicate: (item: T) => boolean): Stream<T>;
        buffer(n: number): Stream<T[]>;
        window(n: number): Stream<T[]>;

        // Combining Streams (needs to return new stream type)
        // combine<U>(stream: Stream<U>): Stream<T | U>;

        // Handling Streams 
        handle(handler: (item: T) => void): HandlerID;
        removeHandler(handlerID: HandlerID): void;
    }

    type Handler<T> = (item: T) => void;

    function map<T, U>(parent: Stream<T>, mapper: (item: T) => U): ProcessedStream<T, U> {
        return new ProcessedStream(parent, (handler: Handler<U>) => {
            return (item: T) => {
                handler(mapper(item))
            };
        });
    }

    function filter<T>(parent: Stream<T>, predicate: (item: T) => boolean): ProcessedStream<T, T> {
        return new ProcessedStream(parent, (handler: Handler<T>) => {
            return (item: T) => {
                if (predicate(item)) {
                    handler(item)
                }
            }
        })
    }

    function buffer<T>(parent: Stream<T>, n: number): ProcessedStream<T, T[]> {
        return new ProcessedStream(parent, (handler: Handler<T[]>) => {
            
            var buffer: T[] = []

            return (item: T) => {
                buffer.push(item)
                if (buffer.length == n) {
                    handler(buffer)
                    buffer = []
                }
            }
        })
    }

    function window<T>(parent: Stream<T>, n: number): ProcessedStream<T, T[]> {
        return new ProcessedStream(parent, (handler: Handler<T[]>) => {
            
            var window: T[] = []

            return (item: T) => {
                window.push(item)
                if (window.length == n) {
                    handler(window)
                    window.shift();
                }
            }
        })
    }
    
    export class BaseStream<T> implements Stream<T> {

        private _handlers: Handler<T>[];
        private _currentID: number;

        constructor() {
            this._handlers = [];
            this._currentID = 0;
        }

        map<U>(mapper: (item: T) => U): Stream<U> {
            return map(this, mapper);
        }

        filter(predicate: (item: T) => boolean): Stream<T> {
            return filter(this, predicate);
        }

        buffer(n: number): Stream<T[]> {
            return buffer(this, n);
        }

        window(n: number): Stream<T[]> {
            return window(this, n);
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

        map<U>(mapper: (item: OutputType) => U): Stream<U> {
            return map(this, mapper);
        }

        filter(predicate: (item: OutputType) => boolean): Stream<OutputType> {
            return filter(this, predicate);
        }

        buffer(n: number): Stream<OutputType[]> {
            return buffer(this, n);
        }

        window(n: number): Stream<OutputType[]> {
            return window(this, n);
        }

        handle(handler: (item: OutputType) => void): HandlerID {
            return this._parent.handle(this._generator(handler));
        }

        removeHandler(handlerID: HandlerID): void {
            this._parent.removeHandler(handlerID);
        }
    }
}
