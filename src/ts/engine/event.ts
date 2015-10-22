module GerpSquirrel.Event {
    export type Event = number;

    export interface Responder {
        (event: Event, eventData: any): void;
    }

    export interface Dispatcher {
        dispatch(event: Event, eventData: any);
        addResponder(event: Event, responder: Responder);
        removeResponder(event: Event, id: ResponderID);
        removeAllResponders(event: Event);
    }

    export function DispatcherMake(): Dispatcher {
        return new _Dispatcher();
    }

    type ResponderID = number;

    class _Dispatcher implements Dispatcher {
        currentID: number;
        responders: Array<Array<Responder>>;

        constructor() {
            this.responders = [];
            this.currentID = 0;
        }

        dispatch(event: Event, eventData: any) {
            if (this.responders[event]) {
                this.responders[event].forEach((responder) => {
                    responder(event, eventData);
                });
            }
        }

        addResponder(event: Event, responder: Responder): ResponderID {
            if (this.responders[event] == null) {
                this.responders[event] = [];
            }
            const id = this.currentID++;
            this.responders[event][id] = responder;

            return id;
        }

        removeResponder(event: Event, id: ResponderID) {
            if (this.responders[event] != null) {
                delete this.responders[event][id];
            }
        }

        removeAllResponders(event: Event) {
            this.responders[event] = [];
        }
    }
}