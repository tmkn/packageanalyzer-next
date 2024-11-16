import { performance } from "perf_hooks";

import * as semver from "semver";
import { QueryClient } from "@tanstack/query-core";

import {
    type IPackageJson,
    isUnpublished,
    type IPackageMetaDataVersionProvider,
    type IPackageMetaDataProvider,
    type PackageMetaData,
    type Url,
    type ILogger,
    type IContext
} from "@lib/shared";

export class OnlinePackageProvider
    implements IPackageMetaDataVersionProvider, IPackageMetaDataProvider
{
    private _queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 3,
                staleTime: Infinity
            }
        }
    });

    constructor(private _url: Url) {}
    async getPackageVersionMetadata(
        name: string,
        version: string | undefined = undefined,
        context: IContext
    ): Promise<IPackageJson> {
        const { logger } = context;
        const start = performance.now();
        const versionToLookup = await this._resolveVersion(name, version, context);
        const versionMetadata = await this._queryClient.fetchQuery({
            queryKey: ["package", name, versionToLookup],
            queryFn: async () => {
                const response = await fetch(
                    `${this._url}/${encodeURIComponent(name)}/${encodeURIComponent(versionToLookup)}`
                );

                if (!response.ok) {
                    throw new Error(
                        `Couldn't get metadata for package "${name}@${versionToLookup}"`
                    );
                }

                const data = (await response.json()) as IPackageJson;

                return data;
            }
        });

        const end = performance.now();
        const span = (end - start).toFixed(2);
        logger.info(`Fetched data for "${name}@${versionToLookup}" (${span}ms)`);

        return versionMetadata;
    }
    async getPackageMetadata(
        name: string,
        context: IContext
    ): Promise<PackageMetaData | undefined> {
        const { logger } = context;
        const start = performance.now();

        try {
            const packageMetadata = await this._queryClient.fetchQuery({
                queryKey: ["package", name],
                queryFn: async () => {
                    const response = await fetch(`${this._url}/${encodeURIComponent(name)}`);
                    const data = (await response.json()) as PackageMetaData;

                    if (response.ok) return data;
                }
            });

            return packageMetadata;
        } catch {
        } finally {
            const end = performance.now();
            const span = (end - start).toFixed(2);
            logger.info(`Fetched metadata "${name}" (${span}ms)`);
        }
    }

    private async _resolveVersion(
        name: string,
        version: string | undefined,
        context: IContext
    ): Promise<string> {
        const packageMetadata = await this.getPackageMetadata(name, context);

        if (packageMetadata === undefined) {
            throw new Error(`Couldn't get metadata for package "${name}"`);
        }

        if (isUnpublished(packageMetadata)) {
            throw new Error(`Package "${name}" was unpublished`);
        }

        const allVersions: string[] = Object.keys(packageMetadata.versions);
        const versionToResolve =
            version !== undefined ? version : packageMetadata["dist-tags"].latest;
        const resolvedVersion: string | null = semver.maxSatisfying(allVersions, versionToResolve);

        if (resolvedVersion === null) {
            throw new Error(`Couldn't resolve version ${version} for "${name}"`);
        }

        return resolvedVersion;
    }
}

export const npmOnline = new OnlinePackageProvider(`https://registry.npmjs.com`);
