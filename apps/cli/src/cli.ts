import { Command } from "@commander-js/extra-typings";

import {
    createRule,
    SimpleEngine,
    type Attachments,
    type ICheckWithAttachments,
    type IContext,
    type IRuleSet,
    type Rule
} from "@lib/shared";
import { WinstonLogger, downloadCount, npmOnline } from "@lib/node";

const ruleSet = new (class implements IRuleSet {
    getRules({ logger }: IContext): Rule<Attachments, any>[] {
        const testCheck: ICheckWithAttachments<
            {
                abc: typeof downloadCount;
                foobar2: typeof downloadCount;
            },
            { hello: number }
        > = {
            name: "lint-test",
            check: ({ logger, pkg, params: { hello } }) => {
                return `Checking ${pkg.fullName}: ${pkg.getAttachmentData("abc").downloads} downloads with arg ${hello}`;
            },
            attachments: {
                abc: downloadCount,
                foobar2: downloadCount
            }
        };

        return [createRule("error", testCheck, { hello: 123 })];
    }
})();

export const program = new Command()
    .name("kiwara")
    .description("A linter for Node.js packages")
    .version("0.0.1")
    .command("lint")
    .description("Lint a package")
    .argument("<package>", "Package to lint")
    .option("-d, --depth <number>", "specify the depth", parseInt, Infinity)
    .action(async (pkg, { depth }) => {
        const logger = new WinstonLogger();

        const engine = new SimpleEngine(pkg, logger, npmOnline, ruleSet, {
            depth
        });

        const code = await engine.run();

        console.log(`Engine exited with code ${code}`);

        process.exit(code);
    });
