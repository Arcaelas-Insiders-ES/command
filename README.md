
![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/dark.svg#gh-dark-mode-only)

![Arcaelas Insiders Banner](https://raw.githubusercontent.com/arcaelas/dist/main/banner/svg/light.svg#gh-light-mode-only)

  

# Welcome to Arcaelas Insiders!

Hello, if this is your first time reading the **[Arcaelas Insiders](https://github.com/arcaelas)**  **documentation**, let me tell you that you have found a good place to learn.  

**Our team** and *community* are happy to write and make methods simple to implement and understand, but I think you already know that.

Let's start with the basic implementation steps.
```bash
> npm i --save @arcaelas/command
> yarn add --save @arcaelas/command
```

## Implementation
```javascript
// Class Import Statement
import Command from  '@arcaelas/command'

// commonjs
const { default: Command }  =  require('@arcaelas/command')

// tsconfig:
//	allowSyntheticDefaultImports: true
const Command  =  require('@arcaelas/command')
```


# Command

Today a wide variety of applications have **commands** to simplify processes and be intuitive, for this reason the **arcaelas** development team has implemented a library dedicated to the construction of **commands**.

```js
const serve  =  new Command({
	description: "Start server!"
});
``` 

# Prompts

It's a simple thing, your command is already stored in the list of enabled commands for the environment.
We could now assume that your command requires a list of parameters, including the port number where you want to run the **server**.
> You can read documentation for [inquirer in npm](https://www.npmjs.com/package/inquirer)

```js
const serve  =  Command({
	questions:{
		port:  {
			type: "number",
			default: 8080,
		}
	}
});
```
> Your command now expects the given port number to be **8080**, but in case the command runs like this:

```serve --port 3000```
Then the **port** property would be **3000** and not **8080**.

# Formats

We can also talk about formatting the expected data in a property, it could be the case that our application requires a specific type of data (string, object, number, array).

```js
const serve  =  new Command({
	options:{
		id:{
			type: "number",
		},
		port:{
			type: "string",
			transformer(input, answers, flags){
				return Number( input )
			},
		}
	}
});
```

Whatever value is passed on the command line, the command handler will use the "**Number**" function to format the indicated data, this means that `serve --port 3000` would result in the property **port** with the numeric value of **3000**, while the command `serve --port uno` would return its value to **NaN**.

Another advantage of using **Command** is the implementation of arrays within its argument line, we could say that your command can only be executed with certain routes, you can indicate them like this `serve --routes /home /dashboard /profile - -port 3000` Naturally, only the first value (**/home**) would be taken into account. To make it an array of values, we use the option with the Array type.

```js
const serve  =  new Command({
	options:{
		port:{
			type:"number"
		},
		routes:{
			type: "checkbox",
		}
	}
})
```

# Handler

Declaring properties and types is a very useful thing to do, but it's useless until you can read those values and make your command actually do what it's supposed to do.

To achieve this we use the **action()** property of the configurations.

```typescript
const serve  =  new Command("serve",  {
	options:{
		port:{
			type: "number",
			default: 8080
		}
	},
	action(options: object, argv: string[]): any | Promise<any> {}
})
```

Now you can bring your command to life, from the **action()** function.

# Execution

Everything seems to be very comfortable to implement and understand, but how do we call our command?

```js

const serve  =  new Command({...});

// or using inherit method
serve.exec(["--port",  8080,  "--routes",  "/home",  "/dashboard",  "/profile /configs"]);

// or using object
serve.exec({
	port: 8080,
	routes:[
		"/home",
		"/dashboard",
		"/profile",
		"/configs",
	]
});

// You can pass command line arguments
serve.exec( process.argv  );
```

<hr/>
<div  style="text-align:center;margin-top:50px;">
	<p  align="center">
		<img  src="https://raw.githubusercontent.com/arcaelas/dist/main/logo/svg/64.svg"  height="32px">
	<p>

¿Want to discuss any of my open source projects, or something else?Send me a direct message on [Twitter](https://twitter.com/arcaelas).</br> If you already use these libraries and want to support us to continue development, you can sponsor us at [Github Sponsors](https://github.com/sponsors/arcaelas).
</div>
