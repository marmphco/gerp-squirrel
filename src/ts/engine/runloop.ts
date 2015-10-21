module GerpSquirrel {
    export interface RenderFunction {
        (timeIntoFrame: number): void;
    }

    export interface UpdateFunction {
        (): void;
    }

    export interface RunLoop {
        run(): void;
        scheduleUpdateFunction(func: () => void, removalPredicate: () => boolean): void;
        scheduleRenderFunction(func: (number) => void, removalPredicate: () => boolean): void;
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
                const timeIntoFrame = elapsedTime / updateInterval;
                renderFunctions = renderFunctions.filter((context) => {
                    context.item(timeIntoFrame);
                    return context.removalPredicate();
                }).concat(pendingRenderFunctions);
                pendingRenderFunctions = [];
                
                const currentTime: number = (new Date()).getTime();
                elapsedTime += currentTime - timeOflastRender;
                timeOflastRender = currentTime;
                
                while (elapsedTime >= updateInterval) {
                    updateFunctions = updateFunctions.filter((context) => {
                        context.item();
                        return context.removalPredicate();
                    }).concat(pendingUpdateFunctions);
                    pendingUpdateFunctions = [];
                    
                    elapsedTime -= updateInterval;
                }
            },
            scheduleUpdateFunction: function(func: () => void, removalPredicate: () => boolean) {
                pendingUpdateFunctions.push({
                    item: func,
                    removalPredicate: removalPredicate
                });
            },
            scheduleRenderFunction: function(func: (number) => void, removalPredicate: () => boolean) {
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