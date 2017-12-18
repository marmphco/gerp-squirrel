module gerpsquirrel.lazy {

    export class Lazy<T> {
        private _value: T
        private _dirty: boolean
        private _generator: () => T

        constructor(generator: () => T) {
            this._dirty = true
            this._generator = generator
        }

        value(): T {
            if (this._dirty) {
                this._value = this._generator()
                this._dirty = false
            }
            return this._value
        }

        markDirty() {
            this._dirty = true
        }
    }    
}