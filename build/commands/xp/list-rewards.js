"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const noblox_js_1 = __importDefault(require("noblox.js"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../config"));
const command = {
    run: async (interaction, client, args) => {
        let xpData = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8"));
        let index = xpData.findIndex(v => v.discordID === interaction.user.id);
        let userData;
        if (index !== -1) {
            userData = xpData[index];
        }
        else {
            userData = {
                discordID: interaction.user.id,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            };
        }
        let rewards = config_1.default.xpSystem.rewards;
        let availableRewardString = "";
        for (let i = 0; i < rewards.length; i++) {
            if (userData.xp >= rewards[i].xpNeeded && !userData.redeemedRewards.includes(rewards[i].rewardID)) {
                if (rewards[i].type === "RobloxRank") {
                    let groupName = (await noblox_js_1.default.getGroup(rewards[i].metadata.groupId)).name;
                    availableRewardString += `**ID**: ${rewards[i].rewardID} | **Reward**: ${rewards[i].metadata.rankName} rank in **${groupName}**\n`;
                }
                else if (rewards[i].type === "DiscordRole") {
                    availableRewardString += `**ID**: ${rewards[i].rewardID} | **Reward**: <@&${rewards[i].metadata.discordRoleId}>\n`;
                }
                else {
                    let willAutomaticallyApply = rewards[i].metadata.willAutomaticallyGiveReward ? "Yes" : "No";
                    availableRewardString += `**ID**: ${rewards[i].rewardID} | **Reward**: ${rewards[i].metadata.rewardString} | **Reward Applied Automatically?**: ${willAutomaticallyApply}`;
                }
            }
        }
        if (availableRewardString === "") {
            let embed = client.embedMaker({ title: "No Rewards Available", description: "You don't have any rewards available at the moment. Try again later", type: "info", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Avaiable Rewards", description: `You have rewards avaiable. To redeem them, run the redeem command\n\n${availableRewardString}`, type: "info", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("list-rewards")
        .setDescription("Lists all the awards that you qualify for which you didn't redeem"),
    commandData: {
        category: "XP",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
