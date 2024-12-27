"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../config"));
class GroupHandler {
    static async loadGroups() {
        for (let i = 0; i < config_1.default.groupIds.length; i++) {
            let groupInfo = await roblox.getGroup(config_1.default.groupIds[i]);
            this.groupData.push({ id: groupInfo.id, name: groupInfo.name });
        }
    }
    static parseGroups() {
        let parsed = [];
        for (let i = 0; i < this.groupData.length; i++) {
            parsed.push({ name: this.groupData[i].name, value: this.groupData[i].name });
        }
        return parsed;
    }
    static getNameFromID(groupID) {
        return this.groupData.find(v => v.id === groupID).name;
    }
    static getIDFromName(groupName) {
        return this.groupData.find(v => v.name === groupName).id;
    }
}
GroupHandler.groupData = [];
exports.default = GroupHandler;
