module gerpsquirrel.event {

    export type HandlerID = number;

    export interface Stream<SourceType, T> { 
        // Stream Transformations
        map<U>(mapper: (item: T) => U): Stream<SourceType, U>;
        filter(predicate: (item: T) => boolean): Stream<SourceType, T>;
        
        // Generating Handlers (just for convenience)
        generate(handler: (item: T) => void): (item: SourceType) => void;

        // Handling Streams 
        handle(handler: (item: T) => void): HandlerID;
        removeHandler(handlerID: HandlerID): void;
    }

    type Handler<T> = (item: T) => void;

    function map<SourceType, T, U>(parent: Stream<SourceType, T>, mapper: (item: T) => U): ProcessedStream<SourceType, T, U> {
        return new ProcessedStream(parent, (handler: Handler<U>) => {
            return (item: T) => {
                handler(mapper(item));
            };
        });
    }

    function filter<SourceType, T>(parent: Stream<SourceType, T>, predicate: (item: T) => boolean): ProcessedStream<SourceType, T, T> {
        return new ProcessedStream(parent, (handler: Handler<T>) => {
            return (item: T) => {
                if (predicate(item)) {
                    handler(item);
                }
            };
        });
    }

    export class BaseStream<T> implements Stream<T, T> {

        private _handlers: Array<Handler<T>>;
        private _currentID: number;

        constructor() {
            this._handlers = [];
            this._currentID = 0;
        }

        generate(handler: (item: T) => void): (item: T) => void {
            return handler;
        }

        map<U>(mapper: (item: T) => U): Stream<T, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: T) => boolean): Stream<T, T> {
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

    class ProcessedStream<SourceType, InputType, OutputType> implements Stream<SourceType, OutputType> {

        private _parent: Stream<SourceType, InputType>;
        private _generator: (handler: Handler<OutputType>) => Handler<InputType>;

        constructor(parent: Stream<SourceType, InputType>, generator: (handler: Handler<OutputType>) => Handler<InputType>) {
            this._parent = parent;
            this._generator = generator;
        }

        generate(handler: Handler<OutputType>): Handler<SourceType> {
            return this._parent.generate(this._generator(handler));
        }

        map<U>(mapper: (item: OutputType) => U): ProcessedStream<SourceType, OutputType, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: OutputType) => boolean): ProcessedStream<SourceType, OutputType, OutputType> {
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
