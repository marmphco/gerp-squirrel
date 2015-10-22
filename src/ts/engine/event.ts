module GerpSquirrel {
    module Event {
        export interface Responder<EventType extends number> {
            (event: EventType, eventData: any): void;
        }

        export interface Dispatcher<EventType extends number> {
            dispatch(event: EventType, eventData: any);
            addResponder(event: EventType, responder: Responder<EventType>);
            removeResponder(event: EventType, id: ResponderID);
        }

        export function DispatcherMake<EventType extends number>(): Dispatcher<EventType> {
            return new _Dispatcher<EventType>();
        }

        type ResponderID = number;

        interface ResponderMap<EventType extends number> {
            [index: ResponderID]: Responder<EventType>
        }

        class _Dispatcher<EventType extends number> implements Dispatcher<EventType> {
            
            responders: ResponderMap<EventType>;

            constructor() {

            }

            dispatch(event: EventType, eventData: any) {

            }

            addResponder(event: EventType, responder: Responder<EventType>) {

            }

            removeResponder(event: EventType, id: ResponderID) {
                
            }
        }
    }
}