import 'colors';
import type { Noop, IObject } from '@arcaelas/utils'

type CommandOptionsArguments<T extends IObject = IObject> = {
    [K in keyof T]: string | number | boolean | Noop | {
        /**
         * @description
         * Short description about this option to show when help command is run on this command.
         */
        description?: string
        /** 
         * @description
         * Function to parse value from argument list.
         */
        type?: Noop
        /**
         * @description
         * Statics props can't be change
         */
        static?: string | number | boolean | null
        /**
         * @description
         * Defult value to use when argument list dont have any value for this argument.
         */
        value?: string | number | boolean | null
    }
}

type CommandOptionsActionOptions<T extends CommandOptionsArguments = CommandOptionsArguments> = {
    [K in keyof T]: T[K] extends Noop ? ReturnType<T[K]> : (
        T[K] extends IObject ? (
            T[K]["type"] extends Noop ? ReturnType<T[K]["type"]> : (
                T[K]["static"] extends never ? T[K]["value"] : T[K]["static"]
            )
        ) : T[K]
    )
}

interface CommandOptions<T extends CommandOptionsArguments = CommandOptionsArguments> {
    /**
     * @deprecated
     * @description
     * Other names you want to use to access this command.
     * @example
     * command({
     *  alias: ["dev", "run", "serve"]
     * })
     * command.exec("dev", ...args)
     */
    alias?: string[]
    /**
     * @description
     * Short description about this command to show on help command run.
     */
    usage?: string
    /**
     * @description
     * List of arguments that will be passed to the command from the execution line.
     * NOTE: Each argument will be processed before the command is executed. 
     */
    arguments?: T
    action(options: CommandOptionsActionOptions<T>, argv: string[]): void
}

export default interface Command<T extends CommandOptionsArguments = CommandOptionsArguments> {
    new(options: CommandOptions<T>): any

    /**
     * @description
     * Show command usage and arguments descriptions in console.
     */
    help(): void

    /**
     * @description
     * Run the command with a given list of arguments that will be formatted according to the argument configuration.
     * @example
     * const start = new Command("serve", {...})
     * 
     * start.exec("--port 8080")
     * start.exec("--port", "8080")
     * start.exec(["--port 8080"])
     * start.exec(["--port", "8080"])
     */
    exec(...argv: Array<string | string[]>): any
}

export default class Command<T extends CommandOptionsArguments = CommandOptionsArguments> {
    private params: IObject = {}
    constructor(private options: CommandOptions<T>) {
        options.arguments ??= {} as any
        for (const key in options.arguments) {
            const value = typeof options.arguments[key] === "function" ? { type: options.arguments } : (
                typeof (options.arguments[key] ?? false) !== "object" || Array.isArray(options.arguments[key])
                    ? { value: options.arguments[key] } : options.arguments[key]
            ) as IObject
            this.params[key] = {
                value: value?.static ?? value?.value ?? null,
                description: value?.description ?? 'N/A',
                type: value?.type ?? value.value?.constructor ?? (v => v),
                set(v) {
                    if (value.static) return
                    if (this.type === Array) {
                        this.value = [].concat(v)
                        this.set = v => this.value.push(...[].concat(v))
                        return
                    }
                    this.value = this.type(v)
                }
            }
        }
    }

    async exec(...argv: Array<string | string[]>) {
        argv = argv.flat(Infinity).map(e => String(e).trim()).filter(Boolean)
        let last
        for (const k of argv as string[]) {
            let [, arg] = k.match(/^--([a-z][\w-_]{2,})/i) || []
            if (arg) last = arg
            else if (last in this.params) {
                this.params[last].set(k)
                if (this.params[last].type !== Array) last = undefined
            }
        }
        const proxy = new Proxy({}, {
            get: (_, k) => this.params[k]?.value,
        })
        return this.options.action(proxy as any, argv as string[])
    }

    help() {
        console.log(`Arcaelas Insiders CLI`.green.bold);
        console.log("%s", this.options.usage || 'N/A')
        console.log("arguments:".yellow.bold)
        for (let k in this.params) {
            let option = this.params[k];
            console.log(`   --${k}`);
            console.log(`       %s`, option.description);
        }
    }
}

export function command<T extends CommandOptionsArguments = CommandOptionsArguments>(options: CommandOptions<T>): Command<T> {
    return new Command(options)
}