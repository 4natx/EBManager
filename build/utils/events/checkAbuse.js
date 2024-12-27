"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkAbuse;
const roblox = require("noblox.js");
const GroupHandler_1 = __importDefault(require("../classes/GroupHandler"));
const config_1 = __importDefault(require("../../config"));
async function checkAbuse(groupID, client) {
    if (!client.isLoggedIn)
        return;
    for (let i = client.groupLogs.length - 1; i >= 0; i--) {
        if (client.groupLogs[i].cooldownExpires >= Date.now()) {
            client.commandCooldowns.splice(i, 1);
        }
        else {
            let rankIndex = client.groupLogs.findIndex(v => v.userID === client.groupLogs[i].userID && client.groupLogs[i].groupID === groupID && v.action === "Rank");
            let exileIndex = client.groupLogs.findIndex(v => v.userID === client.groupLogs[i].userID && client.groupLogs[i].groupID === groupID && v.action === "Exile");
            if (rankIndex != -1) {
                let amount = client.groupLogs[rankIndex].amount;
                if (amount > config_1.default.antiAbuse.thresholds.ranks) {
                    let didError = false;
                    try {
                        if (config_1.default.antiAbuse.actions.ranks === "Suspend") {
                            await roblox.setRank(groupID, client.groupLogs[i].userID, config_1.default.suspensionRank);
                        }
                        else {
                            await roblox.exile(groupID, client.groupLogs[i].userID);
                        }
                    }
                    catch (e) {
                        didError = true;
                        console.error(e);
                    }
                    let channel = await client.channels.fetch(config_1.default.logging.antiAbuse.loggingChannel);
                    if (channel) {
                        let description = `A rank abuser, **${await roblox.getUsernameFromId(client.groupLogs[i].userID)}**, has been detected abusing rank changing privileges in **${GroupHandler_1.default.getNameFromID(groupID)}**`;
                        if (didError) {
                            description += "\n\n**THE AUTOMATIC ACTION CONFIGURED FAILED TO PUNISH THE USER**";
                        }
                        let embed = client.embedMaker({ title: "Rank Abuser Detected", description: description, type: "info", author: client.user });
                        await channel.send({ embeds: [embed] });
                    }
                }
            }
            if (exileIndex != -1) {
                let amount = client.groupLogs[exileIndex].amount;
                if (amount > config_1.default.antiAbuse.thresholds.exiles) {
                    let didError = false;
                    try {
                        if (config_1.default.antiAbuse.actions.exiles === "Suspend") {
                            await roblox.setRank(groupID, client.groupLogs[i].userID, config_1.default.suspensionRank);
                        }
                        else {
                            await roblox.exile(groupID, client.groupLogs[i].userID);
                        }
                    }
                    catch (e) {
                        didError = true;
                        console.error(e);
                    }
                    let channel = await client.channels.fetch(config_1.default.logging.antiAbuse.loggingChannel);
                    if (channel) {
                        let description = `An exile abuser, **${await roblox.getUsernameFromId(client.groupLogs[i].userID)}**, has been detected abusing exile privileges in **${GroupHandler_1.default.getNameFromID(groupID)}**`;
                        if (didError) {
                            description += "\n\n**THE AUTOMATIC ACTION CONFIGURED FAILED TO PUNISH THE USER**";
                        }
                        let embed = client.embedMaker({ title: "Exile Abuser Detected", description: description, type: "info", author: client.user });
                        await channel.send({ embeds: [embed] });
                    }
                }
            }
        }
    }
    setTimeout(async () => {
        await checkAbuse(groupID, client);
    }, 5);
}
