import 'colors';
declare global {
    namespace Arcaela {
        namespace command {
            /**
             * @description Optional properties, in case any of these are received as an argument.
             * @example
             * var options = { port:{ type:Number, value: 3000, macros:[{k:'prod', v:5000}] } }
             * shell: arcaelas --daemon --prod
             * // In this case the port will be Number{5000} since a "prod" argument has been sent.
             */
            interface Macro {
                k: string;
                v: any;
            }
            interface Option {
                /**
                * @description Default Value for this argument
                */
                value?: any;
                /**
                * @description
                * This is the default value of this option, if you specify the "static" field it will be taken as primary and will not be modified.
                * @example
                * {
                *  value:12,
                *  static:13
                * }
                * command.exec("myCommand", ['value', '25'])
                * // Expected: 13
                */
                static?: any;
                /**
                * @description Function to Format value from shell (Default Boolean)
                * @example
                *  port:{ value:5000 }
                * // Expected: true
                *   port:{ value:5000, type:Number }
                * // Expected: Number{ 5000 }
                */
                type(): any;
                /**
                * @description Use this option if that value depend from another argument
                * @example
                * {
                *  options:{
                *   port:{
                *    value:5000,
                *    macros:[{k:'dev',v:3000}]
                *   }
                *  }
                * }
                * command.exec("mycommand", []) // {port:5000}
                * command.exec("mycommand", ['--dev']) // {port:3000}
                */
                macros?: Macro[];
            }
            interface Params {
                /**
                 * @description Residual arguments that were not included in the options but were still sent as arguments.
                 */
                args: Record<string, any[]>;
                /**
                 * @description All the arguments that were sent to the execution of this command.
                 */
                argv: string[];
                /**
                 * @description Object (Key / Value) that includes the values ​​specified in the options field.
                 * Each property includes the value already
                 */
                options: Record<string, string | number | []>;
            }
            interface Props {
                /**
                 * @description This property is defined after the command is created.
                 */
                name?: string;
                /**
                 * @description Textual description of the use of this command.
                 */
                usage?: string;
                /**
                 * @description Options that can be read from the arguments received in the command console.
                 */
                options?: {
                    [k: string]: Option;
                };
                /**
                 * @description Callback that is executed when the command is called, the arguments it receives are formatted with the "Type" function of each option.
                 */
                action(options?: Params['options'], params?: Params): Promise<void>;
            }
            /**
             * @description Remove listener.
             */
            type Unlistener = () => void;
            interface Command extends Props {
                /**
                 * @description command Name
                 */
                readonly name: string;
                /**
                 *  @description Instructions for this command.
                 */
                readonly usage: string;
                /**
                 * @description Use this property to create a listen event for this command, before it is executed.
                 * @param {Params} params - Property that includes the options and arguments received for the execution.
                 * @return {Unlistener}
                 */
                before(params: Params): Unlistener;
                /**
                 * @description Use this property to create a listen event for this command, after it is executed.
                 * @param {Params} params - Property that includes the options and arguments received for the execution.
                 * @return {Unlistener}
                 */
                after(params: Params): Unlistener;
                /**
                 * @description Use this property to execute the command, the parameter that is sent must be an array with the values ​​to be processed.
                 * @param {[]} argv
                 * @example
                 * mycommand.exec(['arg1', 'arg2'])
                 * mycommand.exec( procces.argv.slice( 2 ) )
                 */
                exec(argv: string[]): Promise<Command>;
            }
            /**
             * @description All defined commands are stored here.
             */
            type commands = {
                [k: string]: command.Command;
            };
        }
        module command {
            /**
             * @description - Find some command with iterable function.
             */
            function find(executor: (command: Arcaela.command.Command) => boolean): Arcaela.command.Command;
            /**
             * @description - Quick execution of this command.
             */
            function exec<N extends string, A extends []>(name: N, argv: A): Arcaela.command.Command;
            /**
             * @description - Print all comands usage in the terminal.
             */
            function help(): void;
            /**
             * @description - Return all commands in store.
             */
            function all(): {
                [K: string]: Arcaela.command.Command;
            };
        }
    }
}
declare function command(name: string, props?: Arcaela.command.Props | null): Arcaela.command.Command;
declare namespace command {
    var all: () => Arcaela.command.commands;
    var find: (executor: (c: Arcaela.command.Command) => boolean) => Arcaela.command.Command;
    var exec: (name: string, argv?: string[]) => Promise<Arcaela.command.Command>;
    var help: () => Promise<void>;
}
export = command;
