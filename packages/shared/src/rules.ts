import type { IContext } from "./context.js";

export interface IRule {
    check(context: IContext): void;
}
