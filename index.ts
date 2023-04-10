import 'colors';
import type { Noop, IObject } from '@arcaelas/utils'

type IArguments<O extends IObject = IObject> = {
    [K in keyof O]: string | number | boolean | {
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

type TArguments<T extends IArguments = IArguments> = {
    [K in keyof T]: ReturnType<
        T[K] extends Noop ? T[K] : (
            T[K] extends IObject ? (
                T[K]["type"] extends Noop ? T[K]["type"] : (
                    T[K]["static"] extends undefined ? ()=>T[K]["value"] : ()=>T[K]["static"]
                )
            ) : ()=>T[K]
        )
    >
}


type Inmmutables<T = never> = string | number | boolean | undefined | (
    T extends boolean ? Inmmutables[] : undefined
)

interface IOptions<A extends IArguments = IArguments> {
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
    arguments?: A
    action(options: TArguments<A>, argv: string[]): void
}


export default interface Command<A extends IArguments = IArguments> {
    new (options: IOptions<A>)

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
    exec(...args: Array<Inmmutables<boolean>>): void
}


export default class Command<A extends IArguments = IArguments> {
    private params: IObject = {}
    constructor(private options: IOptions<A>) {
        options.arguments ??= {} as any
        for(const key in options.arguments){
            const value: IObject = typeof (options.arguments[ key ]??false)!=='object'||Array.isArray(options.arguments[key])
                ? { value: options.arguments[key] } : options.arguments[key] as any
            this.params[ key ] = {
                value: value?.static ?? value?.value ?? null,
                description: value?.description ?? 'N/A',
                type: value?.type ?? value.value?.constructor ?? (v=> v),
                set(v){
                    if(value.static) return
                    if(this.type === Array){
                        this.value = [].concat( v )
                        this.set = v=> this.value.push(...[].concat(v))
                        return
                    }
                    this.value = this.type(v)
                }
            }
        }
    }

    async exec(...argv: Inmmutables<boolean>[]){
        argv = argv.flat(Infinity).map(e=>String(e).trim()).filter(Boolean)
        let last
        for(const k of argv as string[]){
            let [, arg] = k.match(/^--([a-z][\w-_]{2,})/i) || []
            if(arg) last = arg
            else if(last in this.params){
                this.params[ last ].set( k )
                if( this.params[ last ].type!==Array) last = undefined
            }
        }
        const proxy = new Proxy({} as TArguments<A>, {
            get: (_,k)=> this.params[ k ]?.value,
        })
        return this.options.action(proxy, argv as string[])
    }

    help(){
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


export const command = <A extends IArguments = IArguments>(options: IOptions<A>): Command<A>=>
    new Command(options)