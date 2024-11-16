import { Package, type IPackage } from "./package.js";
import { type DependencyTypes, type INpmKeyValue, type IPackageJson } from "./npm.js";
import type { AttachmentData, Attachments } from "./attachment.js";
import type { IPackageMetaDataVersionProvider } from "./provider.js";
import type { ILogger } from "./logger.js";
import type { Rule } from "./rules.js";

export type PackageVersion = [name: string, version?: string];

export type AttachmentLookup = Map<IPackage<{}>, Map<Rule<Attachments, any>, any>>;

export interface IPackageVisitor {
    visit: (depType?: DependencyTypes) => Promise<[IPackage<{}>, AttachmentLookup]>;
}

export class Visitor implements IPackageVisitor {
    private _attachmentLookup: AttachmentLookup = new Map();
    private _depthStack: string[] = [];
    private _depType: DependencyTypes = "dependencies";

    constructor(
        private readonly _entry: PackageVersion,
        private readonly _provider: IPackageMetaDataVersionProvider,
        private readonly _logger: ILogger,
        private readonly _rules: Rule<Attachments, any>[],
        private readonly _maxDepth: number = Infinity
    ) {}

    async visit(depType = this._depType): Promise<[Package<{}>, AttachmentLookup]> {
        this._logger.log("Looking up dependencies...");

        try {
            const [name, version] = this._entry;
            const rootPkg = await this._provider.getPackageVersionMetadata(name, version, {
                logger: this._logger
            });
            const root = new Package<AttachmentData<{}>>(rootPkg);

            this._depType = depType;

            await this._addAttachment(root);

            this._depthStack.push(root.fullName);

            try {
                if (this._depthStack.length <= this._maxDepth)
                    await this.visitDependencies(root, rootPkg[depType]);
            } catch (e) {
                this._logger.error("Error evaluating dependencies");

                throw e;
            }

            return [root, this._attachmentLookup];
        } finally {
        }
    }

    private async visitDependencies(
        parent: Package<AttachmentData<{}>>,
        dependencies: INpmKeyValue | undefined
    ): Promise<void> {
        try {
            if (typeof dependencies === "undefined") return;

            const packages: IPackageJson[] = [];

            for (const [name, version] of Object.entries(dependencies)) {
                const resolved = await this._provider.getPackageVersionMetadata(name, version, {
                    logger: this._logger
                });

                packages.push(resolved);
            }

            for (const p of packages) {
                const dependency = new Package<AttachmentData<{}>>(p);

                await this._addAttachment(dependency);

                parent.addDependency(dependency);

                if (this._depthStack.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                } else if (this._depthStack.length < this._maxDepth) {
                    this._depthStack.push(dependency.fullName);
                    await this.visitDependencies(dependency, p[this._depType]);
                }
            }
        } finally {
            this._depthStack.pop();
        }
    }

    private async _addAttachment(p: Package<{}>): Promise<void> {
        const attachmentData: Record<string, any> = {};

        for (const rule of this._rules) {
            const [_severity, check, _params] = rule;

            if ("attachments" in check) {
                const totalAttachments = Object.keys(check.attachments).length;

                for (const [i, [attachmentName, attachmentFn]] of Object.entries(
                    check.attachments
                ).entries()) {
                    try {
                        const attachmentMsg = `[${p.fullName}][Attachment: ${numPadding(
                            i,
                            totalAttachments
                        )} - ${attachmentName}]`;
                        this._logger.log(attachmentMsg);

                        const data = await attachmentFn({
                            p,
                            // logger: (msg: string) => this._logger.log(`${attachmentMsg} - ${msg}`)
                            logger: this._logger
                        });
                        attachmentData[attachmentName] = data;
                    } catch {
                        this._logger.warn(`Failed to apply attachment: ${attachmentName}`);
                    }
                }

                const lookup: Map<Rule<Attachments, any>, any> = this._attachmentLookup.get(p) ??
                new Map();
                lookup.set(rule, attachmentData);
                this._attachmentLookup.set(p, lookup);
            } else {
                this._attachmentLookup.set(p, new Map([[rule, attachmentData]]));
            }
        }
    }
}

export function getPackageVersionfromString(name: string): PackageVersion {
    const isScoped: boolean = name.startsWith(`@`);
    const [part1, part2, ...rest] = isScoped ? name.slice(1).split("@") : name.split("@");

    if (rest.length > 0) throw new Error(`Too many split tokens`);

    if (part1) {
        if (part2?.trim()?.length === 0)
            throw new Error(`Unable to determine version from "${name}"`);

        return isScoped ? [`@${part1}`, part2] : [part1, part2];
    }

    throw new Error(`Couldn't parse fullName token`);
}

export function numPadding(i: number, total: number): string {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);

    return `${iPadding}/${total}`;
}
