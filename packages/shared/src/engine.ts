import chalk from "chalk";

import type { ILogger } from "./logger.js";
import type { IPackageJsonProvider } from "./provider.js";
import { Visitor } from "./visitor.js";

export interface IEngine {
    start(): Promise<number>;
    get logger(): ILogger;
}

enum LogLevel {
    None = 0,
    Error = 1,
    Warning = 2,
    Info = 4,
    Log = 8
}

interface IOptions {
    logLevel: LogLevel;
}

const defaultOptions: IOptions = {
    logLevel: LogLevel.Info | LogLevel.Log | LogLevel.Warning | LogLevel.Error
};

export class SimpleEngine implements IEngine {
    constructor(
        private _rootPackage: string,
        private _logger: ILogger,
        private _provider: IPackageJsonProvider,
        private _options: IOptions = defaultOptions
    ) {}

    async start(): Promise<number> {
        let returnValue = 0;
        const logger = this.logger;
        const visitor = new Visitor([this._rootPackage], this._provider, logger);

        try {
            const root = await visitor.visit();

            logger.log(`Root package: ${root.fullName}`);
        } catch (error: unknown) {
            logger.error((error as Error).toString());

            returnValue = 1;
        }

        return returnValue;
    }

    get logger(): ILogger {
        const logger = new (class implements ILogger {
            constructor(
                private _logger: ILogger,
                private _options: IOptions
            ) {}

            log(message: string): void {
                if (this._options.logLevel & LogLevel.Log) {
                    this._logger.log(message);
                }
            }

            info(message: string): void {
                if (this._options.logLevel & LogLevel.Info) {
                    const prependTag = chalk.gray("[info]");

                    this._logger.info(`${prependTag} ${message}`);
                }
            }

            warn(message: string): void {
                if (this._options.logLevel & LogLevel.Warning) {
                    const prependTag = chalk.yellow("[warn]");

                    this._logger.info(`${prependTag} ${message}`);
                }
            }

            error(message: string): void {
                if (this._options.logLevel & LogLevel.Error) {
                    const prependTag = chalk.red("[error]");

                    this._logger.info(`${prependTag} ${message}`);
                }
            }
        })(this._logger, this._options);

        return logger;
    }
}
