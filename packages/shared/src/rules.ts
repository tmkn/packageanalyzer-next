import type { AttachmentData, Attachments } from "./attachment.js";
import type { IContext } from "./context.js";
import type { IPackage } from "./package.js";

interface ICheckContext<A extends Attachments, T extends Record<string, any> | undefined>
    extends IContext {
    pkg: IPackage<AttachmentData<A>>;
    params: T;
}

export interface ICheck<T extends Record<string, any> | undefined = undefined> {
    name: string;
    check(context: ICheckContext<{}, T>): string | string[] | void;
}

export interface ICheckWithAttachments<
    A extends Attachments,
    T extends Record<string, any> | undefined = undefined
> {
    name: string;
    check(context: ICheckContext<A, T>): void;
    attachments: A;
}

export type Severity = "error" | "warn";

export type Check<A extends Attachments, T extends Record<string, any> | undefined = undefined> =
    | ICheck<T>
    | ICheckWithAttachments<A, T>;

export type Rule<
    A extends Attachments,
    T extends Record<string, any> | undefined = undefined
> = T extends undefined ? [Severity, Check<A, T>] : [Severity, Check<A, T>, T];

export function createRule<A extends Attachments>(
    severity: Severity,
    input: ICheck
): Rule<A, undefined>;
export function createRule<A extends Attachments, T extends Record<string, any>>(
    severity: Severity,
    input: Check<A, T>,
    params: T
): Rule<A, T>;
export function createRule<A extends Attachments, T extends Record<string, any> | undefined>(
    severity: Severity,
    input: Check<A, T>,
    params?: T
): Rule<A, T> {
    if (params !== undefined) {
        return [severity, input, params] as Rule<A, T>;
    }
    return [severity, input] as Rule<A, T>;
}

// Usage Examples
const check1: ICheck = {
    name: "Check without params",
    check: ({ pkg, params }) => {
        console.log("Check without params executed");
    }
};

const check2: ICheckWithAttachments<
    {
        foo: () => Promise<string>;
    },
    { bar: number }
> = {
    name: "Check with attachments and params",
    check: ({ pkg, params }) => {
        const { bar } = params;
        const test = pkg.getAttachmentData("foo");

        console.log("Check with params executed");
    },
    attachments: { foo: async () => "foo" }
};

// Call the function
const tuple1 = createRule("error", check1);
const tuple2 = createRule("warn", check2, { bar: 42 });

async function foo(rule: Rule<Attachments, any>) {
    const [severity, check, params] = rule;

    if ("attachments" in check) {
        for (const fn of Object.values(check.attachments)) {
            // const result = await fn();
        }
    }

    // check.check({ pkg: {} as IPackage, params });
}
