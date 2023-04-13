import 'colors';
import type { Noop, IObject } from "@arcaelas/utils"

type Inmutables = string | number | boolean
type ParseArguments<T extends CommandArguments = CommandArguments> = {
    [K in keyof T]: T[K] extends Noop ? ReturnType<T[K]> : (
        T[K] extends IObject<Noop> ? (
            T[K]["type"] extends Noop ? ReturnType<T[K]["type"]> : (
                T[K]["static"] extends Inmutables ? T[K]["static"] : T[K]["value"]
            )
        ) : T[K]
    )
}

interface CommandArguments {
    [K: string]: Inmutables | Noop<string, Inmutables> | {
        /**
         * @description
         * Short description about this option to show when help command is run on this command.
         */
        description?: string
        /** 
         * @description
         * Function to parse value from argument list.
         */
        type?: Noop<string, Inmutables>
        /**
         * @description
         * Statics props can't be change
         */
        static?: Inmutables
        /**
         * @description
         * Defult value to use when argument list dont receive value for this argument.
         */
        value?: Inmutables
    }
}

interface CommandOptions<T extends CommandArguments = CommandArguments, R extends any = any> {
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
    action: Noop<[ options: ParseArguments<T> , argv: string[] ], R>
}

export default class Command<R extends any = any, T extends CommandArguments = CommandArguments> {

    private params: IObject<any> = {}

    constructor(public options: CommandOptions<T, R>) {
        this.options = { arguments: {} as T, ...options }
        for (const key in this.options.arguments) {
            const value: IObject<Noop> = typeof this.options.arguments[key] === "function" ? { type: this.options.arguments[key] } : (
                typeof (this.options.arguments[key] ?? false) !== "object" || Array.isArray(this.options.arguments[key])
                    ? { value: this.options.arguments[key] } : this.options.arguments[key] as IObject
            )
            this.params[key] = {
                value: value?.static ?? value.value ?? false,
                description: value?.description ?? 'N/A',
                type: value?.type ?? value.value?.constructor ?? (v => v),
                async set(v) {
                    if (value.static) return
                    if (this.type === Array) {
                        this.value = [].concat(v)
                        this.set = v => this.value.push(...[].concat(v))
                        return
                    }
                    this.value = await this.type(v)
                }
            }
        }
    }



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
    async exec(...argv: string[]): Promise<R> {
        argv = argv.flat(Infinity).map(e => String(e).trim()).filter(Boolean)
        let last
        for (const k of argv as string[]) {
            let [, arg] = k.match(/^--([a-z][\w-_]{2,})/i) || []
            if (arg) last = arg
            else if (last in this.params) {
                await this.params[last].set(k)
                if (this.params[last].type !== Array) last = undefined
            }
        }
        const proxy = new Proxy({}, {
            get: (_, k) => (this.params[k])?.value,
        })
        return this.options.action(proxy as any, argv as string[])
    }


    /**
     * @description
     * Show command usage and arguments descriptions in console.
     */
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