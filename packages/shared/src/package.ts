import _ from "lodash";
import assert from "node:assert";

import { type IPackageJson } from "./npm.js";
import type { AttachmentLookup } from "./visitor.js";
import type { Rule } from "./rules.js";
import type { Attachments } from "./attachment.js";

interface IDeprecatedInfo {
    deprecated: boolean;
    message: string;
}

export interface IPackage<T extends Record<string, any> = Record<string, any>> {
    parent: IPackage<T> | null;
    isLoop: boolean;
    name: string;
    version: string;
    fullName: string;
    directDependencies: IPackage<T>[];
    deprecatedInfo: IDeprecatedInfo;

    addDependency: (dependency: IPackage<T>) => void;

    visit: (callback: (dependency: IPackage<T>) => void, includeSelf?: boolean) => void;
    getPackagesBy: (filter: (pkg: IPackage<T>) => boolean) => IPackage<T>[];
    getPackagesByName: (name: string, version?: string) => IPackage<T>[];
    getPackageByName: (name: string, version?: string) => IPackage<T> | null;

    getData(): Readonly<IPackageJson>;
    getData(key: string): unknown;

    // Partial<...> because attachments could have failed during lookup
    getAttachmentData(): Partial<T>;
    getAttachmentData<K extends keyof T>(key: K): T[K];
}

export class Package<T extends Record<string, any>> implements IPackage<T> {
    parent: IPackage<T> | null = null;
    isLoop = false;

    private _attachmentData: T = {} as T;
    private _dependencies: IPackage<T>[] = [];

    constructor(private readonly _data: Readonly<IPackageJson>) {}

    get name(): string {
        return this._data.name;
    }

    get version(): string {
        return this._data.version;
    }

    get fullName(): string {
        return `${this.name}@${this.version}`;
    }

    get directDependencies(): IPackage<T>[] {
        return this._dependencies;
    }

    set directDependencies(dependencies: IPackage<T>[]) {
        this._dependencies = dependencies;
    }

    get deprecatedInfo(): IDeprecatedInfo {
        const deprecated = this.getData("deprecated");

        if (typeof deprecated === "string") {
            return {
                deprecated: true,
                message: deprecated
            };
        }

        return {
            deprecated: false,
            message: ``
        };
    }

    addDependency(dependency: IPackage<T>): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(callback: (dependency: IPackage<T>) => void, includeSelf = false): void {
        if (includeSelf) callback(this);

        for (const child of this._dependencies) {
            callback(child);
            child.visit(callback, false);
        }
    }

    getPackagesBy(filter: (pkg: IPackage<T>) => boolean): IPackage<T>[] {
        const matches: IPackage<T>[] = [];

        this.visit(d => {
            if (filter(d)) matches.push(d);
        }, true);

        return matches;
    }

    getPackagesByName(name: string, version?: string): IPackage<T>[] {
        const matches: IPackage<T>[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else if (d.name === name && d.version === version) {
                matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): IPackage<T> | null {
        const matches: IPackage<T>[] = this.getPackagesByName(name, version);

        return matches[0] ?? null;
    }

    getData(key: string): unknown;
    getData(): Readonly<IPackageJson>;
    getData(key?: string): unknown {
        if (key) return _.get(this._data, key);
        else return JSON.parse(JSON.stringify(this._data));
    }

    getAttachmentData(): Partial<T>;
    getAttachmentData<K extends keyof T>(key: K): T[K];
    getAttachmentData<K extends keyof T>(key?: K): T[K] | Partial<T> {
        if (key) {
            const data = this._attachmentData[key];

            if (typeof data === "undefined") {
                throw new Error(`No attachment data found for "${key.toString()}"`);
            }

            return data;
        } else {
            return structuredClone(this._attachmentData);
        }
    }
}

// wraps pkg in a Proxy and sets the attachment data needed for the rule
export function setAttachments(
    pkg: IPackage<{}>,
    rule: Rule<Attachments, any>,
    attachmentLookup: AttachmentLookup
): IPackage<Record<string, any>> {
    const attachmentData = attachmentLookup.get(pkg);
    assert(attachmentData, `No attachment data found for "${pkg.fullName}"`);
    const dataForRule = attachmentData.get(rule);
    assert(dataForRule, `No attachment data found for rule "${rule[1].name}"`);

    const root = Object.create(pkg);

    Object.defineProperty(root, "_attachmentData", {
        value: dataForRule
    });
    root.directDependencies = pkg.directDependencies.map(dependency => {
        const proxyDependency = setAttachments(dependency as Package<{}>, rule, attachmentLookup);

        proxyDependency.parent = root;

        return proxyDependency;
    });

    return root;
}
