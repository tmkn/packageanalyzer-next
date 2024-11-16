import chalk from "chalk";

import { LogLevel, type ILogger } from "./logger.js";
import type { IPackageMetaDataVersionProvider } from "./provider.js";
import { getPackageVersionfromString, Visitor } from "./visitor.js";
import type { IRuleSet } from "./ruleset.js";
import { setAttachments, type IPackage } from "./package.js";
import type { Check } from "./rules.js";
import type { Attachments } from "./attachment.js";
import { Formatter, LintResultFormatter, type ILintResult } from "./formatter.js";
import { PathUtilities } from "./util/PathUtilities.js";

export interface IEngine {
    run(): Promise<number>;
}

interface IOptions {
    logLevel: LogLevel;
    depth: number;
}

const defaultOptions: IOptions = {
    logLevel: LogLevel.Info | LogLevel.Log | LogLevel.Warning | LogLevel.Error,
    depth: Infinity
};

export class SimpleEngine implements IEngine {
    private _options: IOptions = defaultOptions;
    private logger: ILogger;

    private exitCode: number = 0;

    constructor(
        private _rootPackage: string,
        private _logger: ILogger,
        private _provider: IPackageMetaDataVersionProvider,
        private _ruleSet: IRuleSet,
        private options: Partial<IOptions> = {}
    ) {
        this.logger = this._setupLogger();
        this._options = { ...defaultOptions, ...options };
    }

    async run(): Promise<number> {
        const logger = this.logger;

        try {
            const entry = getPackageVersionfromString(this._rootPackage);
            const rules = this._ruleSet.getRules({ logger });
            const visitor = new Visitor(entry, this._provider, logger, rules, this._options.depth);

            const start = performance.now();
            const [root, attachmentLookup] = await visitor.visit();
            const end = performance.now();
            const span = (end - start).toFixed(2);

            logger.info(`Looking up dependencies took ${span}ms`);

            logger.log(`Root package: ${root.fullName}`);

            const stdoutFormatter = new Formatter(process.stdout);
            const resultFormatter = new LintResultFormatter(stdoutFormatter);
            const lintResults: ILintResult[] = [];
            root.visit(dep => {
                for (const rule of rules) {
                    // most likely bottleneck
                    const depWithAttachments = setAttachments(dep, rule, attachmentLookup);
                    const [severity, check, params] = rule;
                    let checkResult;

                    try {
                        checkResult = check.check({
                            logger,
                            pkg: depWithAttachments,
                            params
                        });
                        if (this._isValidResultFormat(checkResult)) {
                            if (severity === `error`) {
                                this.exitCode = 1;
                            }

                            for (const message of this._toMessageArray(checkResult)) {
                                lintResults.push({
                                    type: severity,
                                    name: check.name,
                                    message,
                                    path: new PathUtilities(depWithAttachments).path,
                                    pkg: depWithAttachments
                                });
                            }
                        } else if (checkResult !== undefined) {
                            throw new Error(
                                `Invalid check implementation! check() must return "string" or "string[]". Returned "${typeof checkResult}"`
                            );
                        }
                    } catch (e) {
                        this._reportError(e, lintResults, check, dep);
                    }
                }
            }, true);

            resultFormatter.format(lintResults);
        } catch (error: unknown) {
            if (error instanceof Error) {
                logger.error(error.message);
            } else {
                logger.error("An unknown error occurred");
            }

            this.exitCode = 1;
        }

        return this.exitCode;
    }

    private _toMessageArray(result: string | string[]): string[] {
        return Array.isArray(result) ? result : [result];
    }

    private _reportError(
        e: unknown,
        lintResults: ILintResult[],
        rule: Check<Attachments, any>,
        dep: IPackage
    ): void {
        this.exitCode = 1;

        if (e instanceof Error)
            lintResults.push({
                type: `internal-error`,
                name: rule.name,
                message: e.message,
                path: new PathUtilities(dep).path,
                pkg: dep
            });
    }

    private _isValidResultFormat(result: unknown): result is string | string[] {
        return (
            typeof result === `string` ||
            (Array.isArray(result) && result.every(r => typeof r === `string`))
        );
    }

    private _setupLogger(): ILogger {
        return new (class implements ILogger {
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
    }
}
