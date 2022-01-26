<img alt="ARCAELAS LOGO" src="https://raw.githubusercontent.com/Arcaelas-Insiders-ES/dist/main/banner/dark.svg" />

# Command

Hoy en día una gran variedad de aplicaciones disponen de **comandos** para simplificar procesos y ser intuitivas, por ese motivo el equipo de desarrollo de **arcaelas** ha implementado una librería dedicada a la construcción de **comandos**.

## Instalación
```bash
npm install arcaelas/command
```

```js
import Command from 'arcaelas/command'
const Command = require("arcaelas/command");
```

Antes que nada, para declarar un comando es necesario especificar un nombre con el cual será identificado.
```js
const serve = Command("serve",{
    usage:"Inicializar un servidor"
});
```

<br/>

# Propiedades dinámicas
Es algo simple, ya tu comando está almacenado en la lista de comandos hábiles para el entorno.

Ahora podríamos asumir que tu comando requiere de una lista de parámetros, entre ellos el número de puerto donde quieres ejecutar el **servidor**.

```js
const serve = Command("serve", {
    options:{
        port: 8080
    }
});
```
> Tu comando ahora espera que el número de puerto indicado sea **8080**, pero en caso de que el comando se ejecute así:
`serve --port 3000`
entonces la propiedad **port** sería **3000** y no sería **8080**.

<br/>

# Propiedades estáticas.
Al igual que las propiedades, tenemos **propiedades estáticas** que sirven para evitar que un mal tipeado del comando nos genere un resultado inesperado, para ello basta con definir dentro de nuestra opción, la propiedad **static**.

```js
const serve = Command("serve", {
    options:{
        port:{
            static:8080
        }
    }
});
```

> Al escribir `serve --port 3000` el valor de la propiedad **port** sería **8080** ya que su valor ha sido definido como estático.

<br/>

# Formatos

Tambien podemos hablar de formatear los datos esperados en una propiedad, podría darse el caso de que nuestra aplicación requiera un tipo específico de datos (string, object, number, array).

```js
const serve = Command("serve",{
    options:{
        port:{
            value:8080, // or static: 8080
            type:Number
        }
    }
});
```

Sea cual sea el valor que se pase por la línea de comandos, el manejador del comando utilizará la función "**Number**" para formatear el dato indicado, esto quiere decir que `serve --port 3000` daría como resultado la propiedad **port** con el valor numerico de **3000**, mientras que el comando `serve --port uno` daría su valor en **NaN**.

Otra de las ventajas de utilizar **Command** es la implementación de arreglos dentro de su línea de argumentos, podríamos decir que tu comando solo puede ejecutarse con ciertas rutas, puedes indicarlas así `serve --routes /home /dashboard /profile --port 3000` de forma natural solo se tomaría en cuenta el primer valor (**/home**), para que sea un arreglo de valores usamos la opción con el tipo Array.

```js
const serve = Command("serve",{
    options:{
        port:{
            type:Number
        },
        routes:{
            type:Array,
        }
    }
})
```

# Handler

Declarar propiedades y tipos es algo muy útil, pero no sirve de nada mientras no puedas leer esos valores y hacer que tu comando realmente cumpla su cometido.

Para lograr esto utilizamos la propiedad **action()** de las configuraciones.
```js
const serve = Command("serve", {
    options:{
        port:{
            type:Number,
            value:8080
        }
    },
    action(params){
        /* Params incluye datos de interés. */
       params.options; // object | Valores recividos en la consola y formateados, junto a los valores por defecto.

       params.args; // object | Propiedades residuales o no específicadas.
       
       params.argv; // array | Lista de argumentos recibidos sin formatear.
    }
})
```

Ahora ya puedes darle vida a tu comando, desde la función **action()**.

# Events

Anexando funcionalidades a los comandos, hemos decidido implementar listeners a estos, los eventos disponibles son **before** y **after**, dichos eventos se ejecutan antes y despues de ejecutar el comando.

```js
const serve = Command("serve", {});

const unBefore = serve.before((params)=>{
    console.log("¡Calling");
});
const unAfter = serve.after((params)=>{
    console.log("Called!");
});

```

> Estos métodos propios del comando, retornan una función que sirve para desvincular el evento de estas funciones.


# Ejecución

Todo parece ser muy cómodo de implementar y entender, pero ¿Como hacemos para llamar nuestro comando?


```js
const serve = Command("serve");

serve.exec(["--port", 8080, "--routes", "/home", "/dashboard", "/profile /configs"]);
// or
serve.exec( process.argv.slice(2) );
```


# Statics

El módulo de command tiene funciones estáticas.

## find(name: string | Function): Command
> Buscar un comando por su nombre o por un iterador.
```js
Command.find("serve").exec([])
```

## help(): never
> Imprimir en la consola o terminal, los comandos definidos.
```js
serve.exec(["-h"]); // Help of serve.
Command.help(); // Help of all commands.
```

<div style="text-align:center;margin-top:50px;">
<hr/>
<img src="https://raw.githubusercontent.com/Arcaelas-Insiders-ES/dist/main/footer/dark.svg" width="400px" style="margin:20px 0;">

> ¿Want to discuss any of my open source projects, or something else?Send me a direct message on [Instagram](https://instagram.com/arcaelas) or [Twitter](https://twitter.com/arcaelas).</br> If you already use these libraries and want to support us to continue development, you can sponsor us at [Github Sponsors](https://github.com/sponsors/arcaelas).
</div>