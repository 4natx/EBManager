"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const command = {
    run: async (interaction, client, args) => {
        let description = "atualmente em desenvolvimento.";
        let embed = client.embedMaker({ title: "FAQ", description: description, type: "info", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("faq")
        .setDescription("Gets a list of random questions that I think people would ask"),
    commandData: {
        category: "Util",
        isEphemeral: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
