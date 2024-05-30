import { SimpleEngine, type IPackageJsonProvider, Visitor } from "@lib/shared";
import { WinstonLogger, npmOnline } from "@lib/node";

const logger = new WinstonLogger();
const engine = new SimpleEngine("react", logger, npmOnline);

engine.start().then(code => {
    console.log(`Engine exited with code ${code}`);
});
