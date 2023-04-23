import Command from "../src"


const command = new Command({
    arguments:{
        year_now: Number,
        year_birth: {
            value: 1995,
            type: Number,
        },
    },
    action(options) {
        return options.year_now - options.year_birth
    },
})

test("arguments:string", async ()=>{
    expect( await command.exec('--year_now', '2023', '--year_birth', '1995') )
        .toEqual(28)
})
test("arguments:object", async ()=>{
    expect(await command.exec({
        year_now: 2023,
        year_birth: 1995,
    })).toEqual(28)
})
test("arguments:string:default", async ()=>{
    expect( await command.exec('--year_now', '2023') )
        .toEqual(28)
})
test("arguments:object:default", async ()=>{
    expect(await command.exec({
        year_now: 2023
    })).toEqual(28)
})