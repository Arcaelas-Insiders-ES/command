import 'colors';
const _ = require('lodash');


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
                k: string,
                v: any
            }
            interface Option {
                /**
                * @description Default Value for this argument
                */
                value?: any
       
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
                static?: any
 
                /**
                * @description Function to Format value from shell (Default Boolean)
                * @example
                *  port:{ value:5000 }
                * // Expected: true
                *   port:{ value:5000, type:Number }
                * // Expected: Number{ 5000 }
                */
                type()
        
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
                macros?: Macro[]
            }
            interface Params {
                /**
                 * @description Residual arguments that were not included in the options but were still sent as arguments.
                 */
                args:Record<string, any[]>
        
                /**
                 * @description All the arguments that were sent to the execution of this command.
                 */
                argv: string[]
        
                /**
                 * @description Object (Key / Value) that includes the values ​​specified in the options field.
                 * Each property includes the value already
                 */
                options:Record<string, string | number | []>
            }
            interface Props {
               /**
                * @description This property is defined after the command is created.
                */
               name?: string

               /**
                * @description Textual description of the use of this command.
                */
               usage?: string

               /**
                * @description Options that can be read from the arguments received in the command console.
                */
               options?:{
                   [k: string]: Option
               }
               /**
                * @description Callback that is executed when the command is called, the arguments it receives are formatted with the "Type" function of each option.
                */
               action(options?: Params['options'], params?: Params) : Promise<void>
            }
            /**
             * @description Remove listener.
             */
            type Unlistener = ()=> void
            interface Command extends Props {
                /**
                 * @description command Name
                 */
                readonly name: string
                /**
                 *  @description Instructions for this command.
                 */
                readonly usage: string
                /**
                 * @description Use this property to create a listen event for this command, before it is executed.
                 * @param {Params} params - Property that includes the options and arguments received for the execution.
                 * @return {Unlistener}
                 */
                before(params: Params): Unlistener
                /**
                 * @description Use this property to create a listen event for this command, after it is executed.
                 * @param {Params} params - Property that includes the options and arguments received for the execution.
                 * @return {Unlistener}
                 */
                after(params: Params): Unlistener
                /**
                 * @description Use this property to execute the command, the parameter that is sent must be an array with the values ​​to be processed.
                 * @param {[]} argv 
                 * @example
                 * mycommand.exec(['arg1', 'arg2'])
                 * mycommand.exec( procces.argv.slice( 2 ) )
                 */
                exec(argv: string[]): Promise<Command>
            }
            /**
             * @description All defined commands are stored here.
             */
            type commands = {
                [k: string] : command.Command
            };
        }
        module command {
            /**
             * @description - Find some command with iterable function.
             */
            function find(executor: (command: Arcaela.command.Command)=> boolean) : Arcaela.command.Command
        
            /**
             * @description - Quick execution of this command.
             */
            function exec<N extends string, A extends []>(name: N, argv: A) : Arcaela.command.Command
        
            /**
             * @description - Print all comands usage in the terminal.
             */
            function help() : void
        
            /**
             * @description - Return all commands in store.
             */
            function all() : {
                [K: string] : Arcaela.command.Command
            }
        }
    }
}


const commands : Arcaela.command.commands = {};
function parseOptions(options = {}, argv = []): Arcaela.command.Params {
    let params = {args:{},argv:[],options:{}}, last;
    params.argv = (argv||[]).map(str=>str.match(/[^\s]\s[^\s]/g)?`"${str}"`:str).join(" ").match(/^-[-a-z]+|\'[^']+'|\"[^"]+\"|[^\s]+/g)||[];
    for(let key of params.argv){
        let hd = key.match(/^--(\w+)/);
        let short = key.split(/^-([a-z]+)/g)[1]?.split("");
        if(short?.length===1) params.args[last=short[0]]=[];
        else if(short?.length) for(let k of short) params.args[k]=[];
        else if(hd) params.args[last=hd[1]]=[];
        else if(last) params.args[last].push(key.replace(/^("(.*)"|'(.*)')$/g,"$2$3"));
    }
    for(let key in options){
        let option = options[ key ];
        if( typeof option!=='object' || Array.isArray(option) ){
            params.options[ key ] = option;
            continue;
        }
        option = { macros:[], value:null, type: Boolean, ...option};
        let value = 'static' in option ? [ option.static ] : (
            params.args[ key ]?.length ? params.args[ key ] : (
                [(option.macros?.find(m=>m.k in params.args)||{v:'value' in option?option.value:true}).v]
            )
        );
        params.options[ key ] = Array.prototype===option.type?.prototype?new option.type(...value):option.type(value[0]);
        delete params.args[ key ];
    }
    return params;
};
function command(name: string, props: Arcaela.command.Props | null = null) : Arcaela.command.Command {
    name = name.replace(/[^a-z:_-]+/gi,'');
    if(props===null) return commands[ name ];
    const $events = { before:[], after:[], };
    return commands[ name ] = {
        name,
        usage: props?.usage || "",
        options: props?.options || {},
        action: props?.action || Function.call,
        before(executor){
            if( typeof executor==='function'){
                $events.before.push( executor );
                return ()=>$events.before.splice( $events.before.findIndex(fn=> fn===executor), 1 );
            }
            return ()=>{};
        },
        after(executor){
            if( typeof executor==='function'){
                $events.after.push( executor );
                return ()=>$events.after.splice( $events.after.findIndex(fn=> fn===executor), 1 );
            }
            return ()=>{};
        },
        async exec(argv: string[]) : Promise<Arcaela.command.Command> {
            const params = parseOptions(this.options, argv);
            if(params.argv.some(a=>['-h','--help'].includes(a))){
                console.log(`Arcaela CLI`.green.bold, ("(Servidores construídos en "+"NodeJS".green+")").bold )
                console.log("command:".yellow.bold, `${this.name}`.green )
                console.log("Usage:".yellow.bold, this.usage )
                console.log("Options:".yellow.bold)
                for(let k in this.options){
                    let option = this.options[ k ];
                    console.log(` --${k}`);
                    console.log(`  Type: `.green.bold, (option.type || Boolean)?.name);
                    console.log(`  Value: `.green.bold, 'static' in option ? option.static: option.value);
                }
                return;
            }
            await _.over( _.values(this.$events.before) )( params.options, params );
            if(typeof props.action==='function')
                await props.action(params.options, params);
            await _.over( _.values(this.$events.after) )( params.options, params );
            return this;
        },
    };
}

command.all = function all(){ return commands; }
command.find = function find(executor: (c: Arcaela.command.Command)=> boolean) : Arcaela.command.Command {
    for(let name in commands){
        let b = executor( commands[name] );
        if(b) return commands[name];
    }
}
command.exec = function exec(name: string, argv: string[] = process.argv.slice(2)) : Promise<Arcaela.command.Command> {
    return commands[name]?.exec( argv );
}
command.help = async function help(){
    console.log(`Arcaela CLI`.green.bold, ("( Servidores construídos en "+"NodeJS".green+" )").bold );
    console.warn(`Available commands:`);
    for(let name in commands){
        let command = commands[ name ];
        console.log("command:".yellow.bold, `${command.name}`.green );
        console.log("Usage:".yellow.bold, command.usage )
        console.log("Options:".yellow.bold)
        for(let k in command.options){
            let option = command.options[ k ];
            console.log(` --${k}`);
            console.log(`  Type: `.green.bold, (option.type || Boolean)?.name);
            console.log(`  Value: `.green.bold, 'static' in option ? option.static: option.value);
        }
        console.log("\n");
    }
};

command("help",{
    action: command.help,
    usage:"Use this command to display all comands helper."
});

export = command;