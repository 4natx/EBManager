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
        let shout = await roblox.getShout(groupID);
        if (!shout) {
            let embed = client.embedMaker({ title: "Sem Aviso", description: "O grupo vinculado não tem um aviso", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embedDescription = "";
        embedDescription += `**Publicador**: ${shout.poster.username}\n`;
        embedDescription += `**Corpo**: ${shout.body}\n`;
        embedDescription += `**Criada**: ${shout.created}\n`;
        let embed = client.embedMaker({ title: "Aviso atual", description: embedDescription, type: "info", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("getshout")
        .setDescription("Recebe o aviso de grupo atual")
        .addStringOption(o => o.setName("group").setDescription("O grupo recebe o aviso").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups())),
    commandData: {
        category: "Shout",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false,
    }
};
exports.default = command;
