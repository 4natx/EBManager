"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const config_1 = __importDefault(require("../../../config"));
const MessagingService_1 = __importDefault(require("../../../utils/classes/MessagingService"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        try {
            await MessagingService_1.default.sendMessage(universeID, "Unlock", {
                jobID: jobID,
                reason: reason
            });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to send the unlock request to the server: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        await client.logAction(`<@${interaction.user.id}> has unlocked the server of **${universeName}** with the job id of **${jobID}** for the reason of **${reason}**`);
        let embed = client.embedMaker({ title: "Success", description: "You've successfully unlocked the inputted server", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("unlock")
        .setDescription("Unlocks the inputted server")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to unlock").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("The reason of why you want to unlock the supplied server").setRequired(true)),
    commandData: {
        category: "Lock",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.lock,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
