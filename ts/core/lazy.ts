module gerpsquirrel.lazy {

    export class Lazy<T> {
        private _value: T | undefined
        private _generator: () => T

        constructor(generator: () => T) {
            this._value = undefined
            this._generator = generator
        }

        value(): T {
            if (this._value === undefined) {
                this._value = this._generator()
            }
            return this._value
        }

        markDirty() {
            this._value = undefined
        }
    }    
}