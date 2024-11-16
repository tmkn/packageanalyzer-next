import {
    Package,
    type DependencyTypes,
    type IBasePackageJson,
    type INpmKeyValue,
    type IPackageJson,
    type IPackageMetaDataVersionProvider
} from "@lib/shared";

type MockBasePackageJson = Omit<Partial<IBasePackageJson>, "dependencies" | "devDependencies">;

export interface IMockPackageJson extends MockBasePackageJson {
    attachments?: Record<string, unknown>;
    dependencies?: IMockPackageJson[];
    devDependencies?: IMockPackageJson[];
    [key: string]: unknown;
}

export function createMockPackage(
    mockData: IMockPackageJson,
    type: DependencyTypes = "dependencies"
): Package<any> {
    const data = convertToPackageJson(mockData, type);
    // @ts-expect-error some properties are missing
    const pkgJson: IPackageJson = {
        ...{
            name: `mockPackage`,
            version: `1.2.3`
        },
        ...data
    };
    const parent = new Package(pkgJson);

    const dependencies = mockData[type] ?? [];

    // set attachment data
    const attachments = mockData.attachments ?? {};
    Object.defineProperty(parent, "_attachmentData", {
        value: attachments
    });
    // for (const [key, value] of Object.entries(attachments)) {
    //     parent.setAttachmentData(key, value);
    // }

    for (const depMockData of dependencies) {
        parent.addDependency(createMockPackage(depMockData, type));
    }

    return parent;
}

function convertToPackageJson(
    mockData: IMockPackageJson,
    type: DependencyTypes
): Partial<IPackageJson> {
    const packageJson: Partial<IPackageJson> = JSON.parse(JSON.stringify(mockData));
    const npmDependencies: INpmKeyValue = {};

    delete packageJson.dependencies;
    delete packageJson.devDependencies;

    const { dependencies = [] } = mockData;

    for (const dependency of dependencies) {
        npmDependencies[dependency.name ?? `pkga_no_name`] = dependency.version ?? `1.3.3.7`;
    }

    switch (type) {
        case "dependencies":
            packageJson.dependencies = npmDependencies;
            break;
        case "devDependencies":
            packageJson.devDependencies = npmDependencies;
            break;
        default:
            const unhandled: never = type;

            throw new Error(
                `Wrong type, expected "dependencies" or "devDependencies", got "${type}"`
            );
    }

    return packageJson;
}

export class MockProvider implements IPackageMetaDataVersionProvider {
    private _cache: Map<string, IPackageJson> = new Map();

    constructor(mockData: IMockPackageJson[], type: DependencyTypes = "dependencies") {
        for (const data of mockData) {
            const root = createMockPackage(data, type);

            root.visit(entry => {
                const packageJson = entry.getData();
                let fullName = `mockPackage@1.2.4`;

                if (packageJson.name && packageJson.version)
                    fullName = `${packageJson.name}@${packageJson.version}`;

                this._cache.set(fullName, packageJson);
            }, true);
        }
    }

    async getPackageVersionMetadata(name: string, version?: string): Promise<IPackageJson> {
        const key = `${name}@${version}`;
        const data = this._cache.get(key);

        if (!data) throw new Error(`Couldn't find mock package "${key}"`);

        return data;
    }
}
