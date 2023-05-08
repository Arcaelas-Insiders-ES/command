#! ts-node
const { build } = require("esbuild")

build({
    bundle: true,
    platform: "node",
    format: "cjs",
    alias: { "~": "src/" },
    outfile: "lib/index.cjs",
    entryPoints: ["src/index.ts"],
})

build({
    bundle: true,
    platform: "node",
    format: "esm",
    alias: { "~": "src/" },
    outfile: "lib/index.js",
    entryPoints: ["src/index.ts"],
})