import { describe, expect, test } from "vitest";

import { getPackageVersionfromString } from "../src/visitor.js";

describe(`Checks Name and Version extraction`, () => {
    test(`Finds name and version`, () => {
        const [name, version] = getPackageVersionfromString(`foo@1.2.3`);

        expect(name).toBe("foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds name and version for local package`, () => {
        const [name, version] = getPackageVersionfromString(`@foo@1.2.3`);

        expect(name).toBe("@foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds only name`, () => {
        const [name, version] = getPackageVersionfromString(`foo`);

        expect(name).toBe("foo");
        expect(version).toBe(undefined);
    });

    test(`Finds only name for local package`, () => {
        const [name, version] = getPackageVersionfromString(`@foo`);

        expect(name).toBe("@foo");
        expect(version).toBe(undefined);
    });

    test(`Fails to parse, throws local package 1`, () => {
        expect(() => getPackageVersionfromString(`@foo@`)).toThrow();
    });

    test(`Fails to parse, throws for local package 2`, () => {
        expect(() => getPackageVersionfromString(`@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for local package 3`, () => {
        expect(() => getPackageVersionfromString(`@@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for package 1 `, () => {
        expect(() => getPackageVersionfromString(`foo@`)).toThrow();
    });

    test(`Fails to parse, throws for package 2`, () => {
        expect(() => getPackageVersionfromString(`foo@2@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for foo@`, () => {
        expect(() => getPackageVersionfromString(`foo@`)).toThrow();
    });
});
