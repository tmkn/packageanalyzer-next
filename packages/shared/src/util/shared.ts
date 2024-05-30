import { z } from "zod";

import { dependencyTypes, type DependencyTypes } from "../npm.js";

const httpString = z.custom<`http://${string}`>(value => {
    if (typeof value === "string") return value.startsWith(`http://`);

    return false;
});

const httpsString = z.custom<`https://${string}`>(value => {
    if (typeof value === "string") return value.startsWith(`https://`);

    return false;
});

export const urlType = z.union([httpString, httpsString]);

export type Url = z.infer<typeof urlType>;

export function isValidDependencyType(type: unknown): type is DependencyTypes {
    return dependencyTypes.safeParse(type).success;
}
