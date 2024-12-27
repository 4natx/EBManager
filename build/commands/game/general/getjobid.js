"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const MessagingService_1 = __importDefault(require("../../../utils/classes/MessagingService"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let username = args["username"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        let rbxID = await roblox.getIdFromUsername(username);
        if (!rbxID) {
            let embed = client.embedMaker({ title: "Invalid Username", description: "The username that you provided is invalid", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        username = await roblox.getUsernameFromId(rbxID);
        let embed = client.embedMaker({ title: "Awaiting...", description: "This function requires a message from the Roblox game, meaning that you'll have to wait for it to get your response", type: "info", author: interaction.user });
        let msg = await interaction.editReply({ embeds: [embed] });
        try {
            await MessagingService_1.default.sendMessage(universeID, "GetJobID", {
                username: username
            });
            client.jobIdsRequested.push({
                msgID: msg.id,
                universeID: universeID,
                channelID: msg.channel.id,
                username: username,
                timeRequested: Date.now()
            });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to send out the request to the Roblox game server for the user's job id: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("getjobid")
        .setDescription("Gets the job ID of the server the inputted user is in")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to get the server job ID of").setRequired(true)),
    commandData: {
        category: "JobID",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.jobIDs,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
