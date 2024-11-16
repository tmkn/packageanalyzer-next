import type { IContext } from "./context.js";
import { type IPackage } from "./package.js";

type SimplePackage = Pick<IPackage, "name" | "version" | "fullName" | "getData">;

export interface IApplyArgs extends IContext {
    p: SimplePackage;
}

export type AttachmentFn<T> = (args: IApplyArgs) => Promise<T>;

export type Attachments = { [key: string]: AttachmentFn<any> };

export type AttachmentData<T extends Attachments> = {
    [K in keyof T]: T[K] extends AttachmentFn<infer R> ? R : never;
};

// const attachments = {
//     foo: async () => "foo",
//     bar: async () => 13
// } satisfies Attachments;

// let data: AttachmentData<typeof attachments> = {
//     foo: "foo",
//     bar: 3
// };
