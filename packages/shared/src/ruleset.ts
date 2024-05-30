import type { IContext } from "./context.js";

export interface IRuleSet {
    getRules(context: IContext): unknown[];
}
