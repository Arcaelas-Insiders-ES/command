import 'colors';
import type { IObject, Noop } from "@arcaelas/utils"

type Inmutables = string | number | boolean
type InmutableConstructors = StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor
type ArgumentsObject<T extends CommandArguments> = {
    [K in keyof T]: T[K] extends Noop ? (
        T[K] extends InmutableConstructors ? ReturnType<T[K]> : (
            Parameters<T[K]> extends [infer I] ? I : any
        )
    ) : (
        T[K] extends IObject<Noop> ? (
            T[K]["type"] extends Noop ? ReturnType<T[K]["type"]> : (
                T[K]["static"] extends Inmutables ? T[K]["static"] : T[K]["value"]
            )
        ) : T[K]
    )
}
type ParseArguments<T extends CommandArguments> = {
    [K in keyof T]: T[K] extends Noop ? ReturnType<T[K]> : (
        T[K] extends IObject<Noop> ? (
            T[K]["type"] extends Noop ? ReturnType<T[K]["type"]> : (
                T[K]["static"] extends Inmutables ? T[K]["static"] : T[K]["value"]
            )
        ) : T[K]
    )
}

interface CommandArguments {
    [K: string]: Inmutables | Noop | {
        /**
         * @description
         * Short description about this option to show when help command is run on this command.
         */
        description?: string
        /**
         * @description
         * This prop indicate if this argument is optional, is true when "value" or "static" is set.
         */
        optional?: boolean
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
     * Description about this command to show on help command run.
     */
    description?: string
    /**
     * @description
     * Props that will be passed to the command from the execution line.
     * NOTE: Each argument will be processed with "type", before the command is executed. 
     */
    arguments?: T
    action(options: ParseArguments<T>, argv: string[]): R | Promise<R>
}

export default interface Command<R = any, T extends CommandArguments = CommandArguments> {
    new(options: CommandOptions<R, T>): this
    (args: Partial<ArgumentsObject<T>> | Array<string | string[]>): Promise<Awaited<
        ConstructorParameters<this> extends [infer P, ...any] ? (
            P extends CommandOptions<any, any> ? ReturnType<P["action"]> : any
        ) : any
    >>
}


export default class Command<R = any, T extends CommandArguments = CommandArguments> {

    protected description: string = "N/A"
    protected types: any = {}
    protected action: Noop = () => { }
    constructor(options: CommandOptions<R, T>) {
        this.action = options.action
        this.description = options.description
        for (const key in (options.arguments || {})) {
            const option = options.arguments[key] ?? { value: false } as any
            this.types[key] = {
                description: option?.description,
                optional: option?.optional
                    || Array.isArray(option)
                    || ['string', 'number', 'boolean'].includes(typeof option)
                    || ('static' in option || 'value' in option),
                value: option === Array ? [] : (
                    Array.isArray(option) ? option : (option?.static ?? option?.value)
                ),
                type: (typeof option === 'function' ? option : (
                    Array.isArray(option) ? Array : (
                        typeof option === 'object' ? (
                            'static' in option ? () => option.static : option?.value?.constructor
                        ) : option?.constructor
                    )
                )) ?? (v => v)
            }
        }
        return this
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
    exec(options: Partial<ArgumentsObject<T>>): ReturnType<this>
    exec(...argv: Array<string | string[]>): ReturnType<this>
    async exec(...argv: any) {
        const props = {} as IObject
        const args = argv.flat(Infinity).filter(Boolean) as any[]
        if (typeof args[0] === 'object')
            Object.assign(props, args[0])
        else {
            let last: string
            for (const item of args) {
                const [, key] = item.match(/^--([a-z][\w-_]{2,})/i) || []
                if (key) last = key
                else if (this.types[last]) {
                    props[last] = this.types[last] === Array
                        ? [].concat(props[last] ?? [], item)
                        : item
                }
            }
        }
        for (const key in this.types) {
            props[key] = await (key in props ? (
                this.types[key].type === Array
                    ? [].concat(props[key])
                    : this.types[key].type(props[key])
            ) : this.types[key].value)
        }
        return this.action(props, args as string[])
    }

    /**
     * @description
     * Show command usage and arguments descriptions in console.
     */
    help() {
        console.log(`Arcaelas Insiders CLI`.green.bold);
        console.log("%s", this.description)
        console.log("arguments:".yellow.bold)
        for (const k in this.types) {
            const option = this.types[k];
            console.log(`   --${k}%s`, option.optional ? '?' : '');
            console.log(`       %s`, option.description);
        }
    }
}