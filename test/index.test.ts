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
    const age = await command.exec('--year_now', '2023', '2014', '--year_birth', '1995')
    console.log("arguments:string", age)
    expect(age).toEqual(28)
})
test("arguments:object", async () => {
    const age = await command.exec({
        year_now: 2023,
        year_birth: 1995,
    })
    console.log("arguments:object", age)
    expect(age).toEqual(28)
})