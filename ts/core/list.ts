module gerpsquirrel.list {

    // A bidirectional linked list
    export interface Listable<T> {
        previous: (Listable<T> & T) | null
        next: (Listable<T> & T) | null
    }

    export type List<T> = Listable<T> & T;

    // Appends item to the end of list
    // Transformation:
    // (list - next), item => (list - item - next)
    export function append<T>(list: List<T>, item: List<T>) {
        if (list.next != null) {
            list.next.previous = item
            item.next = list.next
        }
        list.next = item
        item.previous = list
    }

    // Removes list from its neighbors
    // Transformation:
    // (previous - list - next) => (previous - next), (null - list - null)
    export function remove<T>(list: List<T>) {
        if (list.previous != null) {
            list.previous.next = list.next
        }
        if (list.next != null) {
            list.next.previous = list.previous
        }
        list.previous = list.next = null
    }

    // iterates through list forward. list should not be mutated.
    export function forEach<T>(list: List<T>, fn: (item: List<T>) => void) {
        for (var l: List<T> | null = list; l != null; l = l.next) {
            fn(l);
        }
    }

    // iterates through list forward, removing elements l for which fn(l) = false
    export function filter<T>(list: List<T>, fn: (item: List<T>) => boolean) {
        var l: List<T> | null = list;
        while (l != null) {
            if (fn(l)) {
                l = l.next
            }
            else {
                const next: List<T> | null = l.next
                remove(l)
                l = next
            }
        }
    }

    function test(list: List<number>) {
        var x = list
    }
}