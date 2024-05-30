import { type ILogger } from "@lib/shared";

// todo add winston later
export class WinstonLogger implements ILogger {
    log(message: string): void {
        console.log(message);
    }
    info(message: string): void {
        console.log(message);
    }
    warn(message: string): void {
        console.log(message);
    }
    error(message: string): void {
        console.log(message);
    }
}
