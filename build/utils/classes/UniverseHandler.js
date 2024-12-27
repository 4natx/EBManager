"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
class UniverseHandler {
    static async loadUniverses() {
        let universeString = "";
        config_1.default.universes.map((e) => { universeString += `${e},`; });
        universeString.substring(0, universeString.length - 1);
        let res = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeString}`);
        let body = (await res.json()).data;
        for (let i = 0; i < body.length; i++) {
            this.universeData.push({ id: body[i].id, name: body[i].name });
        }
    }
    static parseUniverses() {
        let parsed = [];
        for (let i = 0; i < this.universeData.length; i++) {
            parsed.push({ name: this.universeData[i].name, value: this.universeData[i].name });
        }
        return parsed;
    }
    static getNameFromID(universeID) {
        return this.universeData.find(v => v.id === universeID).name;
    }
    static getIDFromName(universeName) {
        return this.universeData.find(v => v.name === universeName).id;
    }
}
UniverseHandler.universeData = [];
exports.default = UniverseHandler;
