import { describe, expect, test } from "vitest";

import { createMockPackage } from "../src/testutils/mocks.js";

describe("Package Tests", () => {
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

    test("correctly gets name for root", () => {
        expect(rootPkg.name).toBe("root");
    });

    test("correctly gets version for root", () => {
        expect(rootPkg.version).toBe("1.0.0");
    });

    test("correctly gets full name for root", () => {
        expect(rootPkg.fullName).toBe("root@1.0.0");
    });

    test("correctly gets direct dependencies for root", () => {
        const [dep1, ...rest] = rootPkg.directDependencies;

        expect(dep1.name).toBe("dep1");
        expect(dep1.version).toBe("1.0.0");
        expect(dep1.fullName).toBe("dep1@1.0.0");

        expect(rest).toEqual([]);
    });
});
