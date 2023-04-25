import Command from "../src"

const command = new Command({
    prompts: {
        year_now: {
            type: "number"
        },
        year_birth: {
            type: "number",
            default: 1995,
        },
    },
    action(options) {
        return options.year_now - options.year_birth
    },
})



test("arguments:string", async () => {
    expect(await command.exec('--year_now', '2023', '--year_birth', '1995'))
        .toEqual(28)
})
test("arguments:object", async () => {
    expect(await command.exec({
        year_now: 2023,
        year_birth: 1995,
    })).toEqual(28)
})