/// <reference path="stream.ts" />

module gerpsquirrel.runloop {

    import BaseStream = stream.BaseStream
    import Stream = stream.Stream

    export type Milliseconds = number;

    export interface RenderContext {
        // Time since last render
        elapsedTime: Milliseconds
        // The normalized time interval since the last update
        t: number
    }

    export interface UpdateContext {
        // Time since last update
        updateInterval: Milliseconds
    }

    export class RunLoop {
        
        private _elapsedTime: Milliseconds
        private _updateInterval: Milliseconds
        private _lastRenderTime: number

        private _renderStream: BaseStream<RenderContext>
        private _updateStream: BaseStream<UpdateContext>

        constructor(updateInterval: Milliseconds) {
            this._elapsedTime = 0
            this._updateInterval = updateInterval
            this._lastRenderTime = (new Date()).getTime()

            this._renderStream = new BaseStream()
            this._updateStream = new BaseStream()
        }

        renderStream(): Stream<RenderContext> {
            return this._renderStream
        }

        updateStream(): Stream<UpdateContext> {
            return this._updateStream
        }

        run(): void {
            const updateIntervalFraction = this._elapsedTime / this._updateInterval

            this._renderStream.push({
                elapsedTime: this._elapsedTime,
                t: updateIntervalFraction
            })
            
            const currentTime: number = (new Date()).getTime()
            this._elapsedTime += currentTime - this._lastRenderTime
            this._lastRenderTime = currentTime
            
            while (this._elapsedTime >= this._updateInterval) {
                this._updateStream.push({
                    updateInterval: this._updateInterval
                })
                
                this._elapsedTime -= this._updateInterval
            }
        }

        reset() {
            this._lastRenderTime = (new Date()).getTime()
        }
    }
}