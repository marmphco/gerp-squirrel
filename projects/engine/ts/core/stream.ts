module gerpsquirrel.stream {

    export type HandlerID = number | CompositeHandlerID;
    export interface CompositeHandlerID extends Array<HandlerID> {}

    function isCompositeHandlerID(handlerID: HandlerID): handlerID is CompositeHandlerID {
        return (<CompositeHandlerID>handlerID).length !== undefined;
    }

    export interface Stream<T> { 
        // Stream Transformations
        map<U>(mapper: (item: T) => U): Stream<U>;
        filter(predicate: (item: T) => boolean): Stream<T>;
        buffer(n: number): Stream<T[]>;
        window(n: number): Stream<T[]>;

        // Combining Streams
        combine<U>(stream: Stream<U>): Stream<T | U>;

        // Handling Streams 
        handle(handler: (item: T) => void): HandlerID;
        removeHandler(handlerID: HandlerID): void;
    }

    type Handler<T> = (item: T) => void;

    export abstract class _Stream<T> implements Stream<T> {

        map<U>(mapper: (item: T) => U): Stream<U> {
            return new ProcessedStream(this, (handler: Handler<U>) => {
                return (item: T) => {
                    handler(mapper(item))
                };
            });
        }

        filter(predicate: (item: T) => boolean): Stream<T> {
            return new ProcessedStream(this, (handler: Handler<T>) => {
                return (item: T) => {
                    if (predicate(item)) {
                        handler(item)
                    }
                }
            })
        }

        buffer(n: number): Stream<T[]> {
            return new ProcessedStream(this, (handler: Handler<T[]>) => {
                
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

        window(n: number): Stream<T[]> {
            return new ProcessedStream(this, (handler: Handler<T[]>) => {
                
                var window: T[] = []

                return (item: T) => {
                    window.push(item)
                    handler(window)
                    if (window.length == n) {
                        window.shift()
                    }
                }
            })
        }

        combine<U>(stream: Stream<U>): Stream<T | U> {
            return new ComposedStream(this, stream);
        }

        handle(handler: (item: T) => void): HandlerID {
            // stub implementation
            return 0
        }

        removeHandler(handlerID: HandlerID): void {
            // stub implementation
        }
    }
    
    export class BaseStream<T> extends _Stream<T> implements Stream<T> {

        private _handlers: Handler<T>[];
        private _currentID: number;

        constructor() {
            super()
            this._handlers = [];
            this._currentID = 0;
        }

        handle(handler: (item: T) => void): HandlerID {
            this._handlers[this._currentID] = handler;
            return this._currentID++;
        }

        removeHandler(handlerID: HandlerID): void {
            if (!isCompositeHandlerID(handlerID)) {
                delete this._handlers[handlerID];
            }
        }

        push(item: T) {
            this._handlers.forEach((handler: Handler<T>) => {
                handler(item);
            });
        }
    }

    class ProcessedStream<InputType, OutputType> extends _Stream<OutputType> implements Stream<OutputType> {

        private _parent: Stream<InputType>;
        private _generator: (handler: Handler<OutputType>) => Handler<InputType>;

        constructor(parent: Stream<InputType>, generator: (handler: Handler<OutputType>) => Handler<InputType>) {
            super()
            this._parent = parent;
            this._generator = generator;
        }

        handle(handler: (item: OutputType) => void): HandlerID {
            return this._parent.handle(this._generator(handler));
        }

        removeHandler(handlerID: HandlerID): void {
            this._parent.removeHandler(handlerID);
        }
    }

    class ComposedStream<T1, T2> extends _Stream<T1 | T2> implements Stream<T1 | T2> {

        private _parent1: Stream<T1>;
        private _parent2: Stream<T2>;

        constructor(parent1: Stream<T1>, parent2: Stream<T2>) {
            super()
            this._parent1 = parent1;
            this._parent2 = parent2;
        }

        handle(handler: (item: T1 | T2) => void): HandlerID {
            return [
                this._parent1.handle(handler),
                this._parent2.handle(handler)
            ];
        }

        removeHandler(handlerID: HandlerID): void {
            if (isCompositeHandlerID(handlerID) && handlerID.length >= 2) {
                this._parent1.removeHandler(handlerID[0]);
                this._parent2.removeHandler(handlerID[1]);
            }
        }
    }
}
