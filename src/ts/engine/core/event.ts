module gerpsquirrel.event {

    export interface Receiver<T> {
        (item: T): void;
    }

    type ReceiverID = number;

    export interface Source<T> {
        addReceiver(receiver: Receiver<T>): ReceiverID;
        removeReceiver(receiverID: ReceiverID): void;
        removeAllReceivers(): void;
    }

    export interface Sink<T> {
        publish(item: T): void;
    }

    export interface Stream<T> extends Source<T>, Sink<T> {}

    class _Stream<T> implements Stream<T> {
        currentID: number;
        receivers: Array<Receiver<T>>;

        constructor() {
            this.receivers = [];
            this.currentID = 0;
        }

        publish(item: T): void {
            this.receivers.forEach((receiver) => {
                receiver(item);
            });
        }

        addReceiver(receiver: Receiver<T>): ReceiverID {
            const id = this.currentID++;
            this.receivers[id] = receiver;
            return id;
        }

        removeReceiver(receiverID: ReceiverID): void {
            delete this.receivers[receiverID];
        }

        removeAllReceivers(): void {
            this.receivers = [];
        }
    }

    export function StreamMake<T>(): Stream<T> {
        return new _Stream<T>();
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
