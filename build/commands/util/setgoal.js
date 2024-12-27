"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const ConfigHelpers_1 = __importDefault(require("../../utils/classes/ConfigHelpers"));
const config_1 = __importDefault(require("../../config"));
const command = {
    run: async (interaction, client, args) => {
        let goal = args["goal"];
        config_1.default.counting.goal = goal;
        ConfigHelpers_1.default.writeToConfigFile(client);
        let embed = client.embedMaker({ title: "Goal Set", description: "You've successfully set the goal", type: "success", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("setgoal")
        .setDescription("Sets the new goal for the group counting feature")
        .addNumberOption(o => o.setName("goal").setDescription("The new goal to set").setRequired(true)),
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
