"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const MessagingService_1 = __importDefault(require("../../../utils/classes/MessagingService"));
const RobloxDatastore_1 = __importDefault(require("../../../utils/classes/RobloxDatastore"));
const CommandHelpers_1 = __importDefault(require("../../../utils/classes/CommandHelpers"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let logs = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers_1.default.parseReasons(usernames, args["reason"]);
        if (reasonData.didError) {
            let embed = client.embedMaker({ title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let reasons = reasonData.parsedReasons;
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        for (let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let robloxID = await roblox.getIdFromUsername(username);
            if (!robloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(robloxID);
            let res = await RobloxDatastore_1.default.getModerationData(universeID, robloxID);
            if (res.err) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: res.err
                });
                continue;
            }
            let data = res.data;
            data.muteData.isMuted = true;
            data.muteData.reason = reason;
            try {
                await RobloxDatastore_1.default.setModerationData(universeID, robloxID, data);
            }
            catch (e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            let didMuteError = false;
            try {
                await MessagingService_1.default.sendMessage(universeID, "Mute", { username: username, reason: reason });
            }
            catch (e) {
                didMuteError = true;
                logs.push({
                    username: username,
                    status: "Error",
                    message: `Although this user is now muted, I couldn't mute them in the game because of the following error: ${e}`
                });
            }
            if (!didMuteError) {
                logs.push({
                    username: username,
                    status: "Success"
                });
            }
            await client.logAction(`<@${interaction.user.id}> has muted **${username}** in **${universeName}** for the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mutes the inputted user(s)")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to mute").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the mute(s)").setRequired(false)),
    commandData: {
        category: "Mute",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.mute,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
