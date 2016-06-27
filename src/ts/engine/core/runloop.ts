module gerpsquirrel {
    
    export interface RenderFunction {
        (elapsedTime: number, t: number): void;
    }

    export interface UpdateFunction {
        (elapsedTime: number): void;
    }

    export interface RunLoop {
        run(): void;
        reset(): void;
        scheduleUpdateFunction(func: UpdateFunction, removalPredicate: () => boolean): void;
        scheduleRenderFunction(func: RenderFunction, removalPredicate: () => boolean): void;
        removeAllUpdateFunctions(): void;
        removeAllRenderFunctions(): void;
    }

    interface SchedulingContext<T> {
        item: T;
        removalPredicate: () => boolean;
    }

    export function RunLoopMake(updateInterval: number): RunLoop {
        var elapsedTime: number = 0
        var timeOflastRender: number = (new Date()).getTime()
        var updateFunctions: Array<SchedulingContext<UpdateFunction>> = [];
        var renderFunctions: Array<SchedulingContext<RenderFunction>> = [];
        var pendingUpdateFunctions: Array<SchedulingContext<UpdateFunction>> = [];
        var pendingRenderFunctions: Array<SchedulingContext<RenderFunction>> = [];

        return {
            run: function() {
                const updateIntervalFraction = elapsedTime / updateInterval;
                renderFunctions = renderFunctions.filter((context) => {
                    context.item(elapsedTime, updateIntervalFraction);
                    return context.removalPredicate();
                }).concat(pendingRenderFunctions);
                pendingRenderFunctions = [];
                
                const currentTime: number = (new Date()).getTime();
                elapsedTime += currentTime - timeOflastRender;
                timeOflastRender = currentTime;
                
                while (elapsedTime >= updateInterval) {
                    updateFunctions = updateFunctions.filter((context) => {
                        context.item(updateInterval);
                        return context.removalPredicate();
                    }).concat(pendingUpdateFunctions);
                    pendingUpdateFunctions = [];
                    
                    elapsedTime -= updateInterval;
                }
            },
            reset: function() {
                timeOflastRender = (new Date()).getTime();
            },
            scheduleUpdateFunction: function(func: UpdateFunction, removalPredicate: () => boolean) {
                pendingUpdateFunctions.push({
                    item: func,
                    removalPredicate: removalPredicate
                });
            },
            scheduleRenderFunction: function(func: RenderFunction, removalPredicate: () => boolean) {
                pendingRenderFunctions.push({
                    item: func,
                    removalPredicate: removalPredicate
                });
            },
            removeAllUpdateFunctions: function() {
                updateFunctions = [];
            },
            removeAllRenderFunctions: function() {
                renderFunctions = [];
            }
        }
    }

    export function repeat(times: number): () => boolean {
        var totalTimes = times;
        return function() {
            totalTimes--;
            return totalTimes > 0;
        }
    }

    export function forever(): boolean {
        return true;
    }
}