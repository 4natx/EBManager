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
        let id = args["id"];
        let index = config_1.default.xpSystem.rewards.findIndex(r => r.rewardID === id);
        if (index === -1) {
            let embed = client.embedMaker({ title: "Reward ID Not Allocated", description: "The reward ID supplied is not allocated, pick another one", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        config_1.default.xpSystem.rewards[index].xpNeeded = args["xp"];
        ConfigHelpers_1.default.writeToConfigFile(client);
        let embed = client.embedMaker({ title: "XP Needed Set", description: "You've successfully set the new amount of XP needed to redeem this reward", type: "success", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    autocomplete: async (interaction, client) => {
        let rewardIDs = config_1.default.xpSystem.rewards.map(r => r.rewardID);
        let focused = interaction.options.getFocused();
        let filteredIDs = rewardIDs.filter(r => r.startsWith(focused));
        return await interaction.respond(filteredIDs.map(id => ({ name: id, value: id })));
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("set-xp-needed")
        .setDescription("Sets the XP needed for a reward")
        .addStringOption(o => o.setName("id").setDescription("The ID of the reward").setRequired(true).setAutocomplete(true))
        .addNumberOption(o => o.setName("xp").setDescription("The new amount of XP that would be needed to redeem this reward").setRequired(true)),
    commandData: {
        category: "XP",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
