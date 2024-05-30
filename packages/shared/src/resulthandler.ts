import type { IContext } from "./context.js";

export interface IResultHandler {
    process(results: unknown[], context: IContext): void;
}

export class ResultHandler implements IResultHandler {
    process(results: unknown[], { logger }: IContext): void {
        throw new Error("ResultHandler not yet implemented.");
    }
}
