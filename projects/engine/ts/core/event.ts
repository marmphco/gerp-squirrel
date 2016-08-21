module gerpsquirrel.event {

    interface Source<T> {
        register(handler: (item: T) => void);
    }

    export interface Stream<T> {
        map<U>(mapper: (item: T) => U): Stream<U>;
        filter(predicate: (item: T) => boolean): Stream<T>;
        handle(handler: (item: T) => void);
    }

    type Handler<T> = (item: T) => void;

    // TODO needs a better name
    interface HandlerGenerator<T, U> {
        _source: Source<U>;
        generate(handler: (item: T) => void): (item: U) => void;
    }

    function map<SourceType, T, U>(parent: HandlerGenerator<T, SourceType>, mapper: (item: T) => U): _ProcessedStream<SourceType, T, U> {
        return new _ProcessedStream(parent, (handler: Handler<U>) => {
            return (item: T) => {
                handler(mapper(item));
            };
        });
    }

    function filter<SourceType, T>(parent: HandlerGenerator<T, SourceType>, predicate: (item: T) => boolean): _ProcessedStream<SourceType, T, T> {
        return new _ProcessedStream(parent, (handler: Handler<T>) => {
            return (item: T) => {
                if (predicate(item)) {
                    handler(item);
                }
            };
        });
    }

    class _BaseStream<T> implements Stream<T>, HandlerGenerator<T, T> {

        _source: Source<T>;

        constructor(source: Source<T>) {
            this._source = source;
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

        handle(handler: (item: T) => void) {
            this._source.register(handler);
        }
    }

    class _ProcessedStream<SourceType, InputType, OutputType> implements Stream<OutputType>, HandlerGenerator<OutputType, SourceType> {

        _source: Source<SourceType>;
        private _parent: HandlerGenerator<InputType, SourceType>;
        private _generator: (handler: Handler<OutputType>) => Handler<InputType>;

        constructor(parent: HandlerGenerator<InputType, SourceType>, generator: (handler: Handler<OutputType>) => Handler<InputType>) {
            this._source = parent._source;
            this._parent = parent;
            this._generator = generator;
        }

        generate(handler: Handler<OutputType>): Handler<SourceType> {
            return this._parent.generate(this._generator(handler));
        }

        map<U>(mapper: (item: OutputType) => U): _ProcessedStream<SourceType, OutputType, U> {
            return map(this, mapper);
        }

        filter(predicate: (item: OutputType) => boolean): _ProcessedStream<SourceType, OutputType, OutputType> {
            return filter(this, predicate);
        }

        handle(handler: (item: OutputType) => void) {
            this._source.register(this.generate(handler));
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
