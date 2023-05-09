"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_src = __toESM(require("../src"));
const command = new import_src.default({
  prompts: {
    year_now: {
      type: "number"
    },
    year_birth: {
      type: "number",
      default: 1995
    }
  },
  action(options) {
    return options.year_now - options.year_birth;
  }
});
test("arguments:string", async () => {
  const age = await command.exec("--year_now", "2023", "2014", "--year_birth", "1995");
  console.log("arguments:string", age);
  expect(age).toEqual(28);
});
test("arguments:object", async () => {
  const age = await command.exec({
    year_now: 2023,
    year_birth: 1995
  });
  console.log("arguments:object", age);
  expect(age).toEqual(28);
});
