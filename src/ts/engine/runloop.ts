module GerpSquirrel {
    export interface RenderFunction {
        (number): void;
    }

    export interface UpdateFunction {
        (): void;
    }

    export function RenderLoopMake(updateInterval: number, render: RenderFunction, update: UpdateFunction) {
        var elapsedTime: number = 0;
        var timeOflastRender: number = (new Date()).getTime()

        return function() {
            render(elapsedTime / updateInterval);
            
            const currentTime: number = (new Date()).getTime();
            elapsedTime += currentTime - timeOflastRender;
            timeOflastRender = currentTime;
            
            while (elapsedTime >= updateInterval) {
                update();
                elapsedTime -= updateInterval;
            }
        }
    }
}