"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const noblox_js_1 = __importDefault(require("noblox.js"));
const fs_1 = __importDefault(require("fs"));
const command = {
    run: async (interaction, client, args) => {
        let username = args["username"];
        let robloxID = await noblox_js_1.default.getIdFromUsername(username);
        if (!robloxID) {
            let embed = client.embedMaker({ title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        username = await noblox_js_1.default.getUsernameFromId(robloxID);
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
        userData.robloxID = robloxID;
        if (index !== -1) {
            xpData[index] = userData;
        }
        else {
            xpData.push(userData);
        }
        await fs_1.default.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
        let embed = client.embedMaker({ title: "Set User", description: "You've successfully set your Roblox account", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        await client.logXPAction("Set Roblox User", `<@${interaction.user.id}> has set their linked Roblox account to **${username}**`);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("set-roblox")
        .setDescription("Sets your Roblox account")
        .addStringOption(o => o.setName("username").setDescription("The username of the account to set").setRequired(true)),
    commandData: {
        category: "XP",
        isEphemeral: false,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
