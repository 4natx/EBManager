"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkBans;
const roblox = require("noblox.js");
const fs_1 = __importDefault(require("fs"));
async function isUserInGroup(userID, groupID) {
    let res = await fetch(`https://groups.roblox.com/v2/users/${userID}/groups/roles`);
    let userData = (await res.json()).data;
    let index = userData.findIndex(data => data.group.id === groupID);
    if (index === -1)
        return false;
    return true;
}
async function checkBans(client) {
    if (!client.isLoggedIn)
        return;
    try {
        let bannedUsers = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
        for (let i = 0; i < bannedUsers.length; i++) {
            let groupID = bannedUsers[i].groupID;
            let userID = bannedUsers[i].userID;
            if (await isUserInGroup(userID, groupID)) {
                await roblox.exile(groupID, userID);
            }
        }
    }
    catch (e) {
        console.error(e);
    }
    setTimeout(async () => {
        await checkBans(client);
    }, 10000);
}
