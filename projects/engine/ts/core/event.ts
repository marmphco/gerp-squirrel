module gerpsquirrel.event {

    export interface Stream<SourceType, T> {
        map<U>(mapper: (item: T) => U): Stream<SourceType, U>;
        filter(predicate: (item: T) => boolean): Stream<SourceType, T>;
        handle(handler: (item: T) => void): (item: SourceType) => void;
    }

    type Handler<T> = (item: T) => void;

    function map<SourceType, T, U>(parent: Stream<SourceType, T>, mapper: (item: T) => U): _ProcessedStream<SourceType, T, U> {
        return new _ProcessedStream(parent, (handler: Handler<U>) => {
            return (item: T) => {
                handler(mapper(item));
            };
        });
    }

    function filter<SourceType, T>(parent: Stream<SourceType, T>, predicate: (item: T) => boolean): _ProcessedStream<SourceType, T, T> {
        return new _ProcessedStream(parent, (handler: Handler<T>) => {
            return (item: T) => {
                if (predicate(item)) {
                    handler(item);
                }
            };
        });
    }

    export class BaseStream<T> implements Stream<T, T> {

        handle(handler: (item: T) => void): (item: T) => void {
            return handler;
        }

        map<U>(mapper: (item: T) => U): Stream<T, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: T) => boolean): Stream<T, T> {
            return filter(this, predicate);
        }
    }

    class _ProcessedStream<SourceType, InputType, OutputType> implements Stream<SourceType, OutputType> {

        private _parent: Stream<SourceType, InputType>;
        private _generator: (handler: Handler<OutputType>) => Handler<InputType>;

        constructor(parent: Stream<SourceType, InputType>, generator: (handler: Handler<OutputType>) => Handler<InputType>) {
            this._parent = parent;
            this._generator = generator;
        }

        handle(handler: Handler<OutputType>): Handler<SourceType> {
            return this._parent.handle(this._generator(handler));
        }

        map<U>(mapper: (item: OutputType) => U): _ProcessedStream<SourceType, OutputType, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: OutputType) => boolean): _ProcessedStream<SourceType, OutputType, OutputType> {
            return filter(this, predicate);
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
