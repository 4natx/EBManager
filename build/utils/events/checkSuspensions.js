"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkSuspensions;
const roblox = require("noblox.js");
const fs_1 = __importDefault(require("fs"));
async function checkSuspensions(client) {
    if (!client.isLoggedIn)
        return;
    let suspensions = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8"));
    for (let i = suspensions.length - 1; i >= 0; i--) {
        if (Date.now() < suspensions[i].timeToRelease)
            continue;
        let groupID = suspensions[i].groupID;
        try {
            await roblox.setRank(groupID, suspensions[i].userId, suspensions[i].oldRoleID);
        }
        catch (e) {
            console.error(`There was an error while trying to rerank ${await roblox.getUsernameFromId(suspensions[i].userId)}: ${e}`);
        }
        suspensions.splice(i, 1);
    }
    await fs_1.default.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
    setTimeout(async () => {
        await checkSuspensions(client);
    }, 10000);
}
