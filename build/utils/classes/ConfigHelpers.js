"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../config"));
const config_2 = require("../../config");
const isPrimitive = obj => obj === null || ['string', 'number', 'boolean'].includes(typeof obj);
const isArrayOfPrimitive = obj => Array.isArray(obj) && obj.every(isPrimitive);
const format = arr => `^^^[${arr.map(val => JSON.stringify(val)).join(', ')}]`;
const replacer = (key, value) => isArrayOfPrimitive(value) ? format(value) : value;
const expand = str => str.replace(/(?:"\^\^\^)(\[.*\])(?:\")/g, (match, a) => a.replace(/\\"/g, '"'));
class ConfigHelpers {
    static parseArray(array) {
        let parsed = "[";
        for (let i = 0; i < array.length; i++) {
            let element = array[i];
            let st;
            if (typeof (element) === "string") {
                st = `"${element}"`;
            }
            else {
                st = `${element}`;
            }
            if (i !== array.length - 1) {
                st += ", ";
            }
            parsed += st;
        }
        parsed += "]";
        return parsed;
    }
    static getObjectStrings(object, keyString) {
        let strings = [];
        let keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = object[key];
            let string = keyString ? `${keyString}.${key}` : `${key}`;
            if (typeof (value) === "object" && !Array.isArray(value)) {
                let valueStrings = this.getObjectStrings(value, `${string}`);
                strings = strings.concat(valueStrings);
            }
            else {
                strings.push(string);
            }
        }
        return strings;
    }
    static getPropertyFromString(item, propertyString) {
        let stringArray = propertyString.split(".");
        let value = item;
        for (let i = 0; i < stringArray.length; i++) {
            try {
                value = value[stringArray[i]];
            }
            catch {
                return null;
            }
        }
        return value;
    }
    static setPropertyFromString(item, propertyString, newValue) {
        let stringArray = propertyString.split(".");
        let value = item;
        for (let i = 0; i < stringArray.length; i++) {
            try {
                value = value[stringArray[i]];
            }
            catch {
                return null;
            }
        }
        value = newValue;
    }
    static replaceENVValues(configString) {
        for (let i = 0; i < config_2.envValues.length; i++) {
            let oldValue = `"${process.env[config_2.envValues[i]]}"`;
            let newValue = `process.env.${config_2.envValues[i]}`;
            configString = configString.replace(oldValue, newValue);
        }
        return configString;
    }
    static async writeToConfigFile(client) {
        let configContent = await fs_1.default.promises.readFile(`${process.cwd()}/config.ts`, "utf-8");
        configContent = configContent.slice(0, configContent.indexOf("const config: BotConfig"));
        let temp = config_1.default.lockedCommands;
        config_1.default.lockedCommands = client.originalLockedCommands; // Reset locked commands as we are saving them to the file config
        let jsonContent = expand(JSON.stringify(config_1.default, replacer, 4));
        jsonContent = this.replaceENVValues(jsonContent); // Removes raw ENV values from JSON string
        jsonContent = jsonContent.replace(/"([^"]+)":/g, '$1:'); // Removes quotes from properties
        configContent += `const config: BotConfig = ${jsonContent}\n\nexport default config;`;
        await fs_1.default.promises.writeFile(`${process.cwd()}/config.ts`, configContent);
        config_1.default.lockedCommands = temp; // Restore locked commands
    }
}
exports.default = ConfigHelpers;
