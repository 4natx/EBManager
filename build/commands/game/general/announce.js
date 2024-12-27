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
        let title = args["title"];
        let message = args["message"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        try {
            await MessagingService_1.default.sendMessage(universeID, "Announce", { title: title, message: message });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to send the announcement to the game: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        await client.logAction(`<@${interaction.user.id}> has announced **${message}** with the title of **${title}** to the players of **${universeName}**`);
        let embed = client.embedMaker({ title: "Success", description: "You've successfully sent this announcement to the game", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("announce")
        .setDescription("Announces the inputted message to every game server")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("title").setDescription("The title of the announcement").setRequired(true))
        .addStringOption(o => o.setName("message").setDescription("The message that you wish to announce").setRequired(true)),
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.broadcast,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
