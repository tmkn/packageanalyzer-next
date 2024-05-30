import type { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "./npm.js";
import { type PackageVersion } from "./visitor.js";

export type PackageMetaData = IPackageMetadata | IUnpublishedPackageMetadata;

export interface IPackageMetaDataProvider {
    getPackageMetadata(name: string): Promise<PackageMetaData | undefined>;
}

//loads npm data from a folder
export interface IPackageJsonProvider {
    //load version specific data, loads latest version if no version is specified
    getPackageJson: (...args: PackageVersion) => Promise<IPackageJson>;
}
