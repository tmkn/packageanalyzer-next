import type { IContext } from "./context.js";
import type { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "./npm.js";
import { type PackageVersion } from "./visitor.js";

export type PackageMetaData = IPackageMetadata | IUnpublishedPackageMetadata;

export interface IPackageMetaDataProvider {
    getPackageMetadata(name: string, context: IContext): Promise<PackageMetaData | undefined>;
}

//loads npm data from a folder
export interface IPackageMetaDataVersionProvider {
    getPackageVersionMetadata(...args: [...PackageVersion, IContext]): Promise<IPackageJson>;
}
