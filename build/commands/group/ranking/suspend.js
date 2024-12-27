"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const ms = require("ms");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../../config"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const VerificationHelpers_1 = __importDefault(require("../../../utils/classes/VerificationHelpers"));
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers_1.default.getRobloxUser(interaction.guild.id, interaction.user.id);
        let username = args["username"];
        let userID = await roblox.getIdFromUsername(username);
        let embe = client.embedMaker({ title: "Comando Desativado", description: "Este comando está em manutenção.", type: "error", author: interaction.user });
        return await interaction.editReply({ embeds: [embe] });
        if (!userID) {
            let embed = client.embedMaker({ title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        username = await roblox.getUsernameFromId(userID);
        if (config_1.default.verificationChecks) {
            let verificationStatus = await VerificationHelpers_1.default.preformVerificationChecks(groupID, authorRobloxID, "Ranking", userID);
            if (!verificationStatus.success) {
                let embed = client.embedMaker({ title: "Verification Checks Failed", description: `You've failed the verification checks, reason: ${verificationStatus.err}`, type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        let time = ms(args["time"]);
        if (!time) {
            let embed = client.embedMaker({ title: "Invalid Time Suppiled", description: "You inputted an invalid time, please input a valid one", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let oldRank = await roblox.getRankInGroup(groupID, userID);
        if (oldRank === 0) {
            let embed = client.embedMaker({ title: "User Not In Group", description: "This user is currently not in the group", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let suspensions = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8"));
        let index = suspensions.findIndex(v => v.userId === userID);
        if (index != -1) {
            suspensions[index].timeToRelease = Date.now() + time;
        }
        else {
            let oldRoleID = (await roblox.getRoles(groupID)).find(v => v.rank === oldRank).id;
            suspensions.push({
                groupID: groupID,
                userId: userID,
                reason: args["reason"],
                oldRoleID: oldRoleID,
                timeToRelease: Date.now() + time
            });
            try {
                await roblox.setRank(groupID, userID, config_1.default.suspensionRank);
            }
            catch (e) {
                let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to change the rank of this user: ${e}`, type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        await fs_1.default.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
        await client.logAction(`<@${interaction.user.id}> has suspended **${username}** for **${ms(time, { long: true })}** for the reason of **${args["reason"]}** in **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        let embed = client.embedMaker({ title: "Success", description: `You've successfully suspended this user`, type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("suspend")
        .setDescription("Suspends the given users with the given amount of time")
        .addStringOption(o => o.setName("group").setDescription("The group to do the suspending in").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("The username of the person you wish to suspend").setRequired(true))
        .addStringOption(o => o.setName("time").setDescription("The amount of time you wish to suspend the user for").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("The reason for the suspension").setRequired(true)),
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.ranking,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Ranking"
    }
};
exports.default = command;
