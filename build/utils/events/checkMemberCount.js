"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkMemberCount;
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../config"));
const oldMemberCounts = [];
async function checkMemberCount(groupID, client) {
    if (!config_1.default.counting.enabled)
        return;
    try {
        let groupInfo = await roblox.getGroup(groupID);
        let index = oldMemberCounts.findIndex(v => v.id === groupID);
        if (index === -1) {
            oldMemberCounts.push({ id: groupID, count: groupInfo.memberCount });
            throw ("Skip check");
        }
        if (groupInfo.memberCount === oldMemberCounts[index].count)
            throw ("Skip check");
        let isAddition = groupInfo.memberCount > oldMemberCounts[index].count;
        let isAtGoal = groupInfo.memberCount >= config_1.default.counting.goal;
        let embedTitle;
        if (!isAtGoal) {
            embedTitle = (isAddition ? "Gained Members" : "Lost Members");
        }
        else {
            embedTitle = "Goal Reached";
        }
        let embedDescription = "";
        embedDescription += `We have ${(isAddition ? "gained" : "lost")} **${Math.abs(groupInfo.memberCount - oldMemberCounts[index].count)}** members\n`;
        embedDescription += `**Old MemberCount**: ${oldMemberCounts[index].count}\n`;
        embedDescription += `**New MemberCount**: ${groupInfo.memberCount}`;
        embedDescription += `**Goal Reached?**: ${isAtGoal ? "Yes" : "No"}`;
        let embed = client.embedMaker({ title: embedTitle, description: embedDescription, type: "info", author: client.user });
        let channel = await client.channels.fetch(config_1.default.counting.loggingChannel);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
        oldMemberCounts[index].count = groupInfo.memberCount;
    }
    catch (e) {
        if (e !== "Skip check") {
            console.error(`There was an error while trying to check for member counts: ${e}`);
        }
    }
    setTimeout(async () => {
        await checkMemberCount(groupID, client);
    }, 15000);
}
