"use strict";
require("colors");
const _ = require('lodash');
const commands = {};
function parseOptions(options = {}, argv = []) {
    var _a, _b, _c, _d;
    let params = { args: {}, argv: [], options: {} }, last;
    params.argv = (argv || []).map(str => str.match(/[^\s]\s[^\s]/g) ? `"${str}"` : str).join(" ").match(/^-[-a-z]+|\'[^']+'|\"[^"]+\"|[^\s]+/g) || [];
    for (let key of params.argv) {
        let hd = key.match(/^--(\w+)/);
        let short = (_a = key.split(/^-([a-z]+)/g)[1]) === null || _a === void 0 ? void 0 : _a.split("");
        if ((short === null || short === void 0 ? void 0 : short.length) === 1)
            params.args[last = short[0]] = [];
        else if (short === null || short === void 0 ? void 0 : short.length)
            for (let k of short)
                params.args[k] = [];
        else if (hd)
            params.args[last = hd[1]] = [];
        else if (last)
            params.args[last].push(key.replace(/^("(.*)"|'(.*)')$/g, "$2$3"));
    }
    for (let key in options) {
        let option = options[key];
        if (typeof option !== 'object' || Array.isArray(option)) {
            params.options[key] = option;
            continue;
        }
        option = Object.assign({ macros: [], value: null, type: Boolean }, option);
        let value = 'static' in option ? [option.static] : (((_b = params.args[key]) === null || _b === void 0 ? void 0 : _b.length) ? params.args[key] : ([(((_c = option.macros) === null || _c === void 0 ? void 0 : _c.find(m => m.k in params.args)) || { v: 'value' in option ? option.value : true }).v]));
        params.options[key] = Array.prototype === ((_d = option.type) === null || _d === void 0 ? void 0 : _d.prototype) ? new option.type(...value) : option.type(value[0]);
        delete params.args[key];
    }
    return params;
}
;
function command(name, props = null) {
    name = name.replace(/[^a-z:_-]+/gi, '');
    if (props === null)
        return commands[name];
    const $events = { before: [], after: [], };
    return commands[name] = {
        name,
        usage: (props === null || props === void 0 ? void 0 : props.usage) || "",
        options: (props === null || props === void 0 ? void 0 : props.options) || {},
        action: (props === null || props === void 0 ? void 0 : props.action) || Function.call,
        before(executor) {
            if (typeof executor === 'function') {
                $events.before.push(executor);
                return () => $events.before.splice($events.before.findIndex(fn => fn === executor), 1);
            }
            return () => { };
        },
        after(executor) {
            if (typeof executor === 'function') {
                $events.after.push(executor);
                return () => $events.after.splice($events.after.findIndex(fn => fn === executor), 1);
            }
            return () => { };
        },
        async exec(argv) {
            var _a;
            const params = parseOptions(this.options, argv);
            if (params.argv.some(a => ['-h', '--help'].includes(a))) {
                console.log(`Arcaela CLI`.green.bold, ("(Servidores construídos en " + "NodeJS".green + ")").bold);
                console.log("command:".yellow.bold, `${this.name}`.green);
                console.log("Usage:".yellow.bold, this.usage);
                console.log("Options:".yellow.bold);
                for (let k in this.options) {
                    let option = this.options[k];
                    console.log(` --${k}`);
                    console.log(`  Type: `.green.bold, (_a = (option.type || Boolean)) === null || _a === void 0 ? void 0 : _a.name);
                    console.log(`  Value: `.green.bold, 'static' in option ? option.static : option.value);
                }
                return;
            }
            await _.over(_.values($events.before))(params.options, params);
            if (typeof props.action === 'function')
                await props.action(params.options, params);
            await _.over(_.values($events.after))(params.options, params);
            return this;
        },
    };
}
command.all = function all() { return commands; };
command.find = function find(executor) {
    for (let name in commands) {
        let b = executor(commands[name]);
        if (b)
            return commands[name];
    }
};
command.exec = function exec(name, argv = process.argv.slice(2)) {
    var _a;
    return (_a = commands[name]) === null || _a === void 0 ? void 0 : _a.exec(argv);
};
command.help = async function help() {
    var _a;
    console.log(`Arcaela CLI`.green.bold, ("( Servidores construídos en " + "NodeJS".green + " )").bold);
    console.warn(`Available commands:`);
    for (let name in commands) {
        let command = commands[name];
        console.log("command:".yellow.bold, `${command.name}`.green);
        console.log("Usage:".yellow.bold, command.usage);
        console.log("Options:".yellow.bold);
        for (let k in command.options) {
            let option = command.options[k];
            console.log(` --${k}`);
            console.log(`  Type: `.green.bold, (_a = (option.type || Boolean)) === null || _a === void 0 ? void 0 : _a.name);
            console.log(`  Value: `.green.bold, 'static' in option ? option.static : option.value);
        }
        console.log("\n");
    }
};
command("help", {
    action: command.help,
    usage: "Use this command to display all comands helper."
});
module.exports = command;
