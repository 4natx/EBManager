"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let ranks = await roblox.getRoles(groupID);
        let description = "";
        for (let i = 1; i < ranks.length; i++) {
            if (client.isLockedRole(ranks[i])) {
                description += `**ID**: ${ranks[i].rank} | **Rank**: ${ranks[i].name} | [TRANCADO]\n`;
            }
            else {
                description += `**ID**: ${ranks[i].rank} | **Rank**: ${ranks[i].name}\n`;
            }
        }
        let embed = client.embedMaker({ title: "Ranks no grupo", description: description, type: "info", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("getranks")
        .setDescription("Recebe os ranks do grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para obter os ranks").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups())),
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
