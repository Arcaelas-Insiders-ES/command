#! ts-node
const { build } = require("esbuild")

build({
    entryPoints: ["test/index.test.ts"],
    outdir: "test",
    bundle: false,
    minify: true,
    platform: "node",
    format: "cjs",
})

build({
    entryPoints: ["src/index.ts"],
    outdir: "lib",
    bundle: false,
    minify: true,
    platform: "node",
    format: "cjs",
})