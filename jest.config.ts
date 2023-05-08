import { type Config } from "jest"

export default {
    preset: "ts-jest",
    verbose: true,
    moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node", "mjs"],
    "testEnvironment": "node"
} as Config