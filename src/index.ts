import 'colors';
import Inquirer from 'inquirer';
import type { IObject, Noop } from "@arcaelas/utils"
import type { DistinctQuestion, CheckboxQuestion, InputQuestion, NumberQuestion } from 'inquirer';

export const inquirer = Inquirer.createPromptModule()
export function argv2object(argv: string[]) {
    let last: string = ""
    const props: IObject = {}
    for (const item of argv) {
        const [, key] = item.match(/^--([a-z][\w-_]{2,})/i) || []
        if (key)
            last = key
        else if (last in props)
            props[last] = [].concat(props[last] as any, item as any)
        else
            props[last] = [item] as any
    }
    return props
}

type IPrompts<T extends IObject = IObject> = Record<keyof T, DistinctQuestion<T> & { description?: string }>
type Answered<T extends IPrompts> = {
    [K in keyof T]: T[K] extends CheckboxQuestion<T> ? any[] : (
        T[K] extends InputQuestion<T> ? (
            T[K]['transformer'] extends Noop ? Awaited<ReturnType<T[K]['transformer']>> : any
        ) : (
            T[K] extends NumberQuestion<T> ? number : any
        )
    )
}


interface CommandOptions<T extends IPrompts, R = any> {
    /**
     * @description
     * Description about this command to show on help command run.
     */
    description?: string
    /**
     * @description
     * Represents a collection of questions.
     */
    prompts?: T
    /**
     * @description
     * This method is command handler
     * @param options - Object with answers
     * @param argv - Array with args command line
     */
    action(options: Answered<T>, argv: string[]): R | Promise<R>
}


export default interface Command<R = any, T extends IPrompts = IPrompts> {
    new(options: CommandOptions<T, R>): void
    (options: Answered<T> | Array<string | string[]>): Promise<Awaited<
        ConstructorParameters<this> extends [infer P, ...any] ? (
            P extends CommandOptions<any, any> ? ReturnType<P['action']> : any
        ) : any
    >>
}


export default class Command<R = any, T extends IPrompts = IPrompts> {

    protected prompts: T
    protected description: string
    protected action: Noop = () => { }
    protected inquirer = Inquirer.createPromptModule()
    constructor(options: CommandOptions<T, R>) {
        this.action = options.action
        this.prompts = options.prompts ?? {} as T
        this.description = options.description ?? 'N/A'
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
    exec(options: Partial<Answered<T>>): ReturnType<this>
    exec(...argv: Array<string | string[]>): ReturnType<this>
    async exec(...argv: any) {
        const args = argv.flat(Infinity).filter(Boolean) as any[]
        const props: any = typeof args[0] === 'object' ? args[0] : argv2object(args)
        for (const key in props) {
            const value = [].concat(props[key])
            props[key] = ["list", "rawlist", "checkbox"].includes(this.prompts[key]?.type as any) ? value : value[0]
        }
        const answers = await this.inquirer(this.prompts, props)
        return this.action.call(this, answers, args as string[])
    }

    /**
     * @description
     * Show command usage and arguments descriptions in console.
     */
    help() {
        console.log(`Arcaelas Insiders CLI`.green.bold);
        console.log("%s", this.description)
        console.log("arguments:".yellow.bold)
        for (const k in this.prompts) {
            const option = this.prompts[k];
            console.log(`   --${k}%s`, 'default' in option ? '?' : '');
            console.log(`       %s`, option.description);
        }
    }
}