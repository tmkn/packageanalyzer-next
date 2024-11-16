import { describe, expect, test } from "vitest";

import { createMockPackage } from "../src/testutils/mocks.js";
import { DependencyUtilities } from "../src/util/DependencyUtilities.js";

describe(`Dependency Utilities Tests`, () => {
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
            },
            {
                name: "dep3",
                version: "1.0.0",
                dependencies: [
                    {
                        name: "dep2",
                        version: "2.0.0"
                    }
                ]
            }
        ]
    });

    describe("with root", () => {
        test("correctly gets transitive count for root", () => {
            const { transitiveCount } = new DependencyUtilities(rootPkg, true);

            expect(transitiveCount).toBe(5);
        });

        test("correctly gets distinct name count for root", () => {
            const { distinctNameCount } = new DependencyUtilities(rootPkg, true);

            expect(distinctNameCount).toBe(4);
        });

        test("correctly gets distinct version count for root", () => {
            const { distinctVersionCount } = new DependencyUtilities(rootPkg, true);

            expect(distinctVersionCount).toBe(5);
        });

        test("correctly gets distinct names for root", () => {
            const { distinctNames } = new DependencyUtilities(rootPkg, true);

            expect(distinctNames).toEqual(new Set(["root", "dep1", "dep2", "dep3"]));
        });

        test("correctly gets most referred for root", () => {
            const { mostReferred } = new DependencyUtilities(rootPkg, true);

            expect(mostReferred).toEqual({
                count: 2,
                pkgs: ["dep2"]
            });
        });

        test("correctly gets most direct dependencies for root", () => {
            const { mostDirectDependencies } = new DependencyUtilities(rootPkg, true);

            expect(mostDirectDependencies[0].name).toEqual("root");
        });

        test("correctly gets most versions", () => {
            const { mostVersions } = new DependencyUtilities(rootPkg, true);

            expect(mostVersions).toEqual(new Map([["dep2", new Set(["1.0.0", "2.0.0"])]]));
        });

        test("correctly gets all", () => {
            const { all } = new DependencyUtilities(rootPkg, true);

            expect(all.length).toEqual(5);
        });
    });

    describe("without root", () => {
        test("correctly gets transitive count without root", () => {
            const { transitiveCount } = new DependencyUtilities(rootPkg);

            expect(transitiveCount).toBe(4);
        });

        test("correctly gets distinct name count without root", () => {
            const { distinctNameCount } = new DependencyUtilities(rootPkg);

            expect(distinctNameCount).toBe(3);
        });

        test("correctly gets distinct version count without root", () => {
            const { distinctVersionCount } = new DependencyUtilities(rootPkg);

            expect(distinctVersionCount).toBe(4);
        });

        test("correctly gets distinct names without root", () => {
            const { distinctNames } = new DependencyUtilities(rootPkg);

            expect(distinctNames).toEqual(new Set(["dep1", "dep2", "dep3"]));
        });
    });
});
