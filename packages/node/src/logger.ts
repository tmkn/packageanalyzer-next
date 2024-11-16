import { type ILogger } from "@lib/shared";

// todo add winston later, or not
export class WinstonLogger implements ILogger {
    log(message: string): void {
        // console.log(message);
        process.stdout.write(`${message}\n`);
    }
    info(message: string): void {
        // console.log(message);
        process.stdout.write(`${message}\n`);
    }
    warn(message: string): void {
        // console.log(message);
        process.stdout.write(`${message}\n`);
    }
    error(message: string): void {
        // console.log(message);
        process.stderr.write(`${message}\n`);
    }
}
