import { describe, expect, test } from "vitest";

import { createMockPackage } from "../src/testutils/mocks.js";

import { PathUtilities } from "../src/util/PathUtilities.js";

describe(`Path Utilities Tests`, () => {
    const rootPkg = createMockPackage({
        name: "root",
        version: "1.0.0",
        dependencies: [
            {
                name: "dep1",
                version: "1.0.0",
                dependencies: [
                    {
                        name: "dep2",
                        version: "1.0.0"
                    }
                ]
            }
        ]
    });

    test("correctly gets path for root", () => {
        const { path } = new PathUtilities(rootPkg);

        expect(path).toEqual([["root", "1.0.0"]]);
    });

    test("correctly gets path for dep2", () => {
        const { path } = new PathUtilities(rootPkg.directDependencies[0].directDependencies[0]);

        expect(path).toEqual([
            ["root", "1.0.0"],
            ["dep1", "1.0.0"],
            ["dep2", "1.0.0"]
        ]);
    });

    test("correctly gets path string for dep2", () => {
        const { pathString } = new PathUtilities(
            rootPkg.directDependencies[0].directDependencies[0]
        );

        expect(pathString).toBe("root@1.0.0 → dep1@1.0.0 → dep2@1.0.0");
    });
});
