"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkAudits;
const roblox = require("noblox.js");
const fs_1 = __importDefault(require("fs"));
const GroupHandler_1 = __importDefault(require("../classes/GroupHandler"));
const config_1 = __importDefault(require("../../config"));
const oldDates = [];
async function checkAudits(groupID, client) {
    if (!client.isLoggedIn)
        return;
    let currentUser = client.robloxInfo;
    try {
        let auditLog = await roblox.getAuditLog(groupID, "", undefined, "Desc", 100);
        if (!oldDates.find(v => v.id === groupID))
            oldDates.push({ id: groupID, date: auditLog.data[0].created });
        let dateIndex = oldDates.findIndex(v => v.id === groupID);
        let auditIndex = auditLog.data.findIndex(log => log.created.toISOString() === oldDates[dateIndex].date.toISOString());
        if (auditIndex === 0 || auditIndex === -1)
            throw ("Skip check");
        for (let i = auditIndex - 1; i >= 0; i--) {
            let log = auditLog.data[i];
            if (log.actor.user.userId === currentUser.UserID)
                continue;
            if (log.actionType === "Post Status" && config_1.default.logging.shout.enabled) {
                let channel = await client.channels.fetch(config_1.default.logging.shout.loggingChannel);
                if (channel) {
                    let embedDescription = "";
                    embedDescription += `**Grupo**: ${GroupHandler_1.default.getNameFromID(groupID)}\n`;
                    embedDescription += `**Publicador de Aviso**: ${log.actor.user.username}\n`;
                    embedDescription += `**Função**: ${log.actor.role.name}\n`;
                    embedDescription += `**Conteúdo do Aviso**: ${log.description["Text"]}\n`;
                    embedDescription += `**Horário**: ${log.created}\n`;
                    let embed = client.embedMaker({ title: "Novo aviso detectado", description: embedDescription, type: "info", author: client.user });
                    await channel.send({ embeds: [embed] });
                }
            }
            else if (log.actionType === "Change Rank") {
                let isUserSuspended = false;
                let suspensions = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8"));
                let susIndex = suspensions.findIndex(v => v.userId === log.description["TargetId"] && v.groupID === groupID);
                if (susIndex !== -1)
                    isUserSuspended = true;
                let isLockedRank = client.isLockedRole((await roblox.getRoles(groupID)).find(v => v.name === log.description["NewRoleSetName"]));
                if (isUserSuspended && await roblox.getRankInGroup(groupID, log.description["TargetId"]) != config_1.default.suspensionRank) {
                    try {
                        await roblox.setRank(groupID, log.description["TargetId"], config_1.default.suspensionRank);
                    }
                    catch (e) {
                        console.error(`There was an error re-ranking ${log.description["TargetName"]} to the suspended role: ${e}`);
                    }
                }
                else if (isLockedRank) {
                    try {
                        await roblox.setRank(groupID, log.description["TargetId"], log.description["OldRoleSetId"]);
                    }
                    catch (e) {
                        console.error(`There was an error re-ranking ${log.description["TargetName"]} to their old role: ${e}`);
                    }
                }
                if (config_1.default.logging.audit.enabled) {
                    let channel = await client.channels.fetch(config_1.default.logging.audit.loggingChannel);
                    if (channel) {
                        let embedDescription = "";
                        embedDescription += `**Grupo**: ${GroupHandler_1.default.getNameFromID(groupID)}\n`;
                        embedDescription += `**Ranker**: ${log.actor.user.username}\n`;
                        embedDescription += `**Função**: ${log.actor.role.name}\n`;
                        embedDescription += `**Jogador**: ${log.description["TargetName"]}\n`;
                        embedDescription += `**Rank Mudado**: ${log.description["OldRoleSetName"]} -> ${log.description["NewRoleSetName"]}\n`;
                        embedDescription += `**Horário**: ${log.created}\n`;
                        if (isUserSuspended) {
                            embedDescription += "\n\n**This action has been reversed because this user is currently suspended**";
                        }
                        else if (isLockedRank) {
                            embedDescription += "\n\n**This action has been reversed because this user was ranked to a configured locked rank**";
                        }
                        let embed = client.embedMaker({ title: "Nova ação detectada", description: embedDescription, type: "info", author: client.user });
                        await channel.send({ embeds: [embed] });
                    }
                }
            }
            else if (config_1.default.logging.audit.enabled) {
                let channel = await client.channels.fetch(config_1.default.logging.audit.loggingChannel);
                if (channel) {
                    let embedDescription = "";
                    embedDescription += `**Grupo**: ${GroupHandler_1.default.getNameFromID(groupID)}\n`;
                    embedDescription += `**Autor**: ${log.actor.user.username}\n`;
                    embedDescription += `**Função**: ${log.actor.role.name}\n`;
                    embedDescription += `**Ação**: ${log.actionType}\n`;
                    embedDescription += `**Horário**: ${log.created}\n`;
                    let embed = client.embedMaker({ title: "Nova ação detectada", description: embedDescription, type: "info", author: client.user });
                    await channel.send({ embeds: [embed] });
                }
            }
            if (log.actionType === "Change Rank") {
                let antiAAIndex = client.groupLogs.findIndex(v => v.userID === log.actor.user.userId && v.action === "Rank");
                if (antiAAIndex === -1) {
                    client.groupLogs.push({ groupID: groupID, userID: log.actor.user.userId, cooldownExpires: Date.now() + 60000, action: "Rank", amount: 1 });
                }
                else {
                    client.groupLogs[antiAAIndex].amount += 1;
                }
            }
            else if (log.actionType === "Remove Member") {
                let antiAAIndex = client.groupLogs.findIndex(v => v.userID === log.actor.user.userId && v.action === "Exile");
                if (antiAAIndex === -1) {
                    client.groupLogs.push({ groupID: groupID, userID: log.actor.user.userId, cooldownExpires: Date.now() + 60000, action: "Exile", amount: 1 });
                }
                else {
                    client.groupLogs[antiAAIndex].amount += 1;
                }
            }
        }
        oldDates[dateIndex].date = auditLog.data[0].created;
    }
    catch (e) {
        if (e !== "Skip check") {
            console.error(`There was an error while trying to check the audit logs: ${e}`);
        }
    }
    setTimeout(async () => {
        await checkAudits(groupID, client);
    }, 5000);
}
