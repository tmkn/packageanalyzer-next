import { expect, test } from "vitest";

test("adds 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
});

function foo(arr: string[]) {
    const first: string = arr[0];
}
