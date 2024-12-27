"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkJobIDs;
const noblox_js_1 = __importDefault(require("noblox.js"));
async function checkJobIDs(client) {
    for (let i = client.jobIdsRequested.length - 1; i >= 0; i--) {
        let entry = client.jobIdsRequested[i];
        let msg = await (await client.channels.fetch(entry.channelID)).messages.fetch(entry.msgID);
        if (!msg) { // Message probably got deleted if this passes
            client.jobIdsRequested.splice(i, 1);
            continue;
        }
        if (Date.now() - entry.timeRequested >= 15_000) { // Remove old entries and assume that no job ID was found
            let embed = client.embedMaker({ title: "No Job ID Found", description: "A job ID wasn't found for this user. This is probably because they aren't in the game", type: "error", author: client.user });
            embed.setAuthor(msg.embeds[0].author);
            await msg.edit({ embeds: [embed] });
            client.jobIdsRequested.splice(i, 1);
            continue;
        }
        try {
            let dbEntry = (await noblox_js_1.default.getDatastoreEntry(entry.universeID, "GetJobIDRequests", entry.username)).data;
            let jobID = dbEntry.split("|")[0];
            let placeID = dbEntry.split("|")[1];
            let joinCode = `\`\`\`Roblox.GameLauncher.joinGameInstance(${placeID}, '${jobID}')\`\`\``;
            let embed = client.embedMaker({ title: "Job ID Found", description: `The job ID of the supplied user has been found, it is **${jobID}**\n\nUse the following code to join them directly via the website\n${joinCode}`, type: "success", author: client.user });
            embed.setAuthor(msg.embeds[0].author);
            await msg.edit({ embeds: [embed] });
            await noblox_js_1.default.deleteDatastoreEntry(entry.universeID, "GetJobIDRequests", entry.username);
            client.jobIdsRequested.splice(i, 1);
        }
        catch (e) {
            let err = e.toString();
            if (!err.includes("NOT_FOUND")) {
                console.error(e);
            }
        }
    }
    setTimeout(async () => {
        await checkJobIDs(client);
    }, 5000);
}
