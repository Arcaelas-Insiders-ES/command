import 'colors';
import type { IObject, Noop } from "@arcaelas/utils"

type Inmutables = string | number | boolean
type ParseArguments<T extends CommandArguments> = {
    [K in keyof T]: T[K] extends Noop ? ReturnType<T[K]> : (
        T[K] extends IObject<Noop> ? (
            T[K]["type"] extends Noop ? ReturnType<T[K]["type"]> : (
                T[K]["static"] extends Inmutables ? T[K]["static"] : T[K]["value"]
            )
        ) : T[K]
    )
}

interface CommandArguments{
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

interface CommandOptions<R extends any, T extends CommandArguments> {
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
    action(options: ParseArguments<T>, argv: string[]): R | Promise<R>
}

export default interface Command<R = any, T extends CommandArguments = CommandArguments> extends Function {
    
    new (options: CommandOptions<R, T>): this
    (args: string[]): Promise<Awaited<
        ConstructorParameters<this> extends [ infer P, ...any ] ? (
            P extends CommandOptions<any, any> ? ReturnType<P["action"]> : any
        ) : any
    >>

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
    exec(options: ParseArguments<T>): ReturnType<this>
    exec(...argv: Array<string | string[]>): ReturnType<this>

    /**
     * @description
     * Show command usage and arguments descriptions in console.
     */
    help(): void
}


export default class Command<R = any, T extends CommandArguments = CommandArguments> extends Function {

    protected params: IObject<any> = {}
    constructor(private options: CommandOptions<R, T>) {
		super("...args", "return this.exec(...args)")
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
        return this.bind( this )
    }

    public async exec(...argv: any){
        const [ options, ...args ] = argv.flat().map(String).filter(Boolean)
        if(typeof (options??false) === 'object'){
            for(const key in options)
                await this.params[ key ]?.set(options[ key ])
        }
        else {
            let last
            for (const k of args as string[]) {
                let [, arg] = k.match(/^--([a-z][\w-_]{2,})/i) || []
                if (arg) last = arg
                else if (last in this.params) {
                    await this.params[last].set(k)
                    if (this.params[last].type !== Array) last = undefined
                }
            }
        }
        const proxy = new Proxy({}, { get: (_, k) => (this.params[k])?.value })
        return this.options.action(proxy as any, args as string[])
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