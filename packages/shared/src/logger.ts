export enum LogLevel {
    None = 0,
    Error = 1,
    Warning = 2,
    Info = 4,
    Log = 8
}

export interface ILogger {
    log(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
