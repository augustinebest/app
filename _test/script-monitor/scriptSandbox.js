const { join } = require("path");
const {performance} = require('perf_hooks');

// TODO - make this configurable from admin-dashboard
const runConfig = {
    availableImports: ['axios'], // init allowed modules
    maxSyncStatementDuration: 3000,
    maxScriptRunTime: 5000,
};

class ScriptMonitorError extends Error {
    constructor(errors, message = "Script monitor resource error") {
        super();
        this.message = message;
        this.errors = Array.isArray(errors)
        ? errors.reduce(
              (allErr, err) => [...allErr, err.message].join(','),
              []
          )
        : (errors.message ?? errors);
    }
}

const {
    availableImports,
    maxScriptRunTime,
    maxSyncStatementDuration,
} = runConfig;

const runScript = async (functionCode, isCalled, options = { maxScriptRunTime, maxSyncStatementDuration }) => {
    const {
        isMainThread,
        Worker,
        parentPort,
        workerData,
    } = require('worker_threads');

    if (isMainThread) {
        // modifiable option in development mode only
        const { maxScriptRunTime, maxSyncStatementDuration } = options;
        if (!isCalled) return;
        const start = performance.now();
        return new Promise(resolve => {
            const worker = new Worker(__filename, {
                workerData: { functionCode },
                execArgv: [
                    ...process.execArgv,
                    '--unhandled-rejections=strict',
                ], // handle promise rejection warnings
            });

            const consoleLogs = [];
            let lastMessage = null;

            worker.on('message', ({type, payload}) => {
                switch (type) {
                    case 'ping': {
                        lastMessage = Date.now();
                        break;
                    }
                    case 'log':{
                        consoleLogs.push(payload);
                        break;
                    }
                    default: {
                        if (type.error) {
                            resolve({
                                success: false,
                                error: type.error,
                                status: 'error',
                                executionTime: performance.now() - start,
                                consoleLogs,
                            });
                        }
                        break;
                    }
                }
            });
            worker.on('online', () => {
                lastMessage = Date.now();
            });
            worker.on('exit', exitCode => {
                switch (exitCode) {
                    case 0:
                        resolve({
                            success: true,
                            status: 'completed',
                            executionTime: performance.now() - start,
                            consoleLogs,
                        });
                        break;
                    case 1: {
                        const message = statementTimeExceeded
                            ? `Max. synchronous statement execution time exceeded (${maxSyncStatementDuration}ms)`
                            : scriptTimeExceeded
                            ? `Max. script execution time exceeded (${maxScriptRunTime}ms)`
                            : 'Script was terminated';
                        resolve({
                            success: false,
                            message,
                            status: 'timeout',
                            executionTime: performance.now() - start,
                            consoleLogs,
                        });
                        break;
                    }
                    default:
                        resolve({
                            success: false,
                            message: 'Unknown Error: script terminated',
                            status: 'terminated',
                            executionTime: performance.now() - start,
                            consoleLogs,
                        });
                        break;
                }

                clearInterval(checker);
            });
            worker.on('error', err => {
                if (err.errors) {
                    resolve({
                        success: false,
                        message: err.message,
                        errors: err.errors,
                        status: 'nonEmptyCallback',
                        executionTime: performance.now() - start,
                        consoleLogs,
                    });
                    return;
                }

                resolve({
                    success: false,
                    message: err.message,
                    status: 'error',
                    executionTime: performance.now() - start,
                    consoleLogs,
                });
                clearInterval(checker);
                worker.terminate();
            });

            let totalRuntime = 0,
                statementTimeExceeded = false,
                scriptTimeExceeded = false;

            const checker = setInterval(
                () => {
                    totalRuntime += 1000;
                    if (totalRuntime > maxScriptRunTime) {
                        clearInterval(checker);
                        scriptTimeExceeded = true;
                        worker.terminate();
                    }
                    // Last ping was too long ago, terminate it
                    if (
                        lastMessage !== null &&
                        Date.now() - lastMessage >= maxSyncStatementDuration
                    ) {
                        clearInterval(checker);
                        statementTimeExceeded = true;
                        worker.terminate();
                    }
                },
                1000,
                maxSyncStatementDuration
            );
        });
    } else {
        // worker_threads code
        const { NodeVM } = require('vm2');
        const vm = new NodeVM({
            eval: false,
            wasm: false,
            require: {
                root: './',
                external: availableImports,
                import: availableImports,
            },
            console: 'redirect',
        });

        vm.on('console.log', (log) => {
            parentPort.postMessage({type: 'log', payload: `[log]: ${log}`});
        });

        vm.on('console.error', (error) => {
            parentPort.postMessage({type: 'log', payload: `[error]: ${error}`});
        });

        vm.on('console.warn', (error) => {
            parentPort.postMessage({type: 'log', payload: `[warn]: ${error}`});
        });

        const scriptCompletedCallback = err => {
            if (err) {
                throw new ScriptMonitorError(err);
            }
        };

        const code = workerData.functionCode;
        setInterval(() => parentPort.postMessage({type: 'ping'}), 500);
        const sandboxFunction = await vm.run(
            `module.exports = ${code}`,
            join(process.cwd(), 'node_modules')
        );

        await sandboxFunction(scriptCompletedCallback);
        process.exit();
    }
};

module.exports = runScript();
module.exports.runScript = runScript;
