module gerpsquirrel.profile {

    export interface _Profile {
        [key: string]: _Profile | number;
    };

    export type Profile = _Profile | {};

    var _sharedProfile: Profiler;

    export function sharedProfiler(): Profiler {
        if (!_sharedProfile) {
             _sharedProfile = new Profiler()
        }
        return _sharedProfile;
    }

    export class Profiler {

        private _startTimes: { [key: string]: number };
        private _results: { [key: string]: number };

        constructor() {
            this.clear();
        }

        // path is a dot delimited path specification like:
        // simulation.collision.treeGeneration
        begin(path: string) {
            this._startTimes[path] = Date.now();
            if (!(path in this._results)) {
                this._results[path] = 0
            }
        }

        end(path: string) {
            const diff = Date.now() - this._startTimes[path];
            this._results[path] += diff;
            this._startTimes[path] = Date.now();
        }

        clear() {
            this._startTimes = {};
            this._results = {};
        }

        results(): Profile {
            var profile: Profile = {};

            for (var path in this._results) {
                const result = this._results[path];
                const pathComponents = path.split(".");
                const lastPathComponent = pathComponents.pop()!;

                // strange way to traverse down a dictionary
                var leaf = pathComponents.reduce((leaf, pathComponent) => {
                    if (!(pathComponent in leaf)) {
                        leaf[pathComponent] = {};
                    }
                    return leaf[pathComponent];
                }, profile);
                leaf[lastPathComponent] = result;
            }

            return profile;
        }
    }
}