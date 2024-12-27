"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../config"));
const command = {
    run: async (interaction, client, args) => {
        let discordID = args["user"];
        let amount = args["amount"];
        let xpData = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8"));
        let index = xpData.findIndex(v => v.discordID === discordID);
        let userData;
        if (index !== -1) {
            userData = xpData[index];
        }
        else {
            userData = {
                discordID: discordID,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            };
        }
        userData.xp -= amount;
        if (index !== -1) {
            xpData[index] = userData;
        }
        else {
            xpData.push(userData);
        }
        await fs_1.default.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
        let embed = client.embedMaker({ title: "Removed XP", description: "You've successfully removed the XP from the user", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        await client.logAction(`<@${interaction.user.id}> has removed **${amount}** XP from <@${discordID}>'s XP balance`);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("remove-xp")
        .setDescription("Removes XP from a user")
        .addUserOption(o => o.setName("user").setDescription("The user to remove XP from").setRequired(true))
        .addNumberOption(o => o.setName("amount").setDescription("The amount of XP to remove").setRequired(true)),
    commandData: {
        category: "XP",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.xp,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
