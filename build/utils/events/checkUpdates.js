"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkUpdates;
const fs_1 = __importDefault(require("fs"));
async function checkUpdates(client) {
    let localVersion = Number(JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/package.json`, "utf-8")).version.replaceAll(".", ""));
    let remoteVersion = Number((await (await fetch("https://raw.githubusercontent.com/sv-du/rbx-manager/master/package.json")).json()).version.replaceAll(".", ""));
    let oldActivity = client.user.presence.activities[0];
    if (remoteVersion > localVersion) {
        //client.setStatusActivity();
        client.onLatestVersion = true;
    }
    else {
        //client.setStatusActivity();
        client.onLatestVersion = true;
    }
    setTimeout(async () => {
        await checkUpdates(client);
    }, 5000);
}
