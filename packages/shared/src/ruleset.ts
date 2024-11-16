import type { Attachments } from "./attachment.js";
import type { IContext } from "./context.js";
import type { Rule } from "./rules.js";

export interface IRuleSet {
    getRules(context: IContext): Rule<Attachments, any>[];
}
