import chalk from "chalk";
import { Writable } from "stream";

import type { IPackage } from "./package.js";
import type { Severity } from "./rules.js";

export interface ILintResult {
    type: Severity | "internal-error";
    name: string;
    message: string;
    pkg: IPackage;
    path: Array<[string, string]>;
}

export interface ILintResultFormatter {
    formatter: IFormatter;
    format(results: ILintResult[]): void;
}

export class LintResultFormatter implements ILintResultFormatter {
    constructor(public formatter: IFormatter) {}

    format(results: ILintResult[]): void {
        let errorCount: number = 0;
        let warningCount: number = 0;
        let internalErrorCount: number = 0;
        let currentPackagePath: string | undefined = undefined;

        for (const { type, name, message, pkg, path } of results) {
            const severity = this.#severityColor(type);
            //beautify path
            const packagePath: string = path
                .map(([name, version]) => `${name}@${version}`)
                .map(name => chalk.cyan(name))
                .join(chalk.white(` → `));

            // Print the package path only once
            if (currentPackagePath !== packagePath) {
                currentPackagePath = packagePath;
                this.formatter.writeLine(`\n${chalk.cyan(currentPackagePath)}`);
            }

            this.formatter.writeLine(
                `  [${severity}][${chalk.cyan(pkg.fullName)}][${chalk.gray(name)}]: ${message}`
            );

            if (type === `error`) {
                errorCount++;
            } else if (type === `warn`) {
                warningCount++;
            } else if (type === `internal-error`) {
                internalErrorCount++;
            }
        }

        if (results.length > 0) {
            const warningMsg = chalk.yellow(`${warningCount} warning(s)`);
            const errorMsg = chalk.red(`${errorCount} error(s)`);

            this.formatter.writeLine(`\nFound ${warningMsg} and ${errorMsg}`);
        } else {
            const noIssuesMsg = chalk.green(`Found no issues`);

            this.formatter.writeLine(`\n${noIssuesMsg} (0 warnings, 0 errors)`);
        }

        if (internalErrorCount > 0) {
            this.formatter.writeLine(
                chalk.bgRed(
                    `Terminated with ${internalErrorCount} internal error(s), please check lint output`
                )
            );
        }
    }

    #severityColor(type: ILintResult["type"]): string {
        switch (type) {
            case `error`:
                return chalk.red(type);
            case `warn`:
                return chalk.yellow(type);
            case `internal-error`:
                return chalk.bgRed(type);
        }
    }
}

type LineKeyValue = [string, string];

export interface IFormatter {
    writeLine: (line: string) => void;
    writeGroup: (lines: Array<LineKeyValue | string>) => void;
    writeIdentation: (lines: [string, ...string[]], padding: number) => void;
}

export class Formatter implements IFormatter {
    constructor(private _writer: Writable) {}

    writeLine(line: string): void {
        this._writer.write(`${line}\n`);
    }

    writeGroup(lines: Array<LineKeyValue | string>): void {
        const padding: number =
            lines.reduce((prev, current) => {
                if (Array.isArray(current)) {
                    const [key] = current;

                    if (key.length > prev) return key.length;
                }

                return prev;
            }, 0) + 2;

        for (const line of lines) {
            if (typeof line === "string") {
                this.writeLine(line);
            } else {
                const [key, value] = line;
                const keyPadding = `${key}:`.padEnd(padding);

                this.writeLine(`${keyPadding}${value}`);
            }
        }
    }

    writeIdentation(lines: [string, ...string[]], padding: number): void {
        const padStr = new Array(padding).fill(" ").join("");
        const [header, ...rest] = lines;

        this.writeLine(header);

        for (const line of rest) {
            this.writeLine(`${padStr}${line}`);
        }
    }
}
