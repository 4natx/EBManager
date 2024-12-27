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
        let groupInfo;
        try {
            groupInfo = await roblox.getGroup(groupID);
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `Houve um erro ao tentar obter as informações do grupo: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embedDescription = "";
        embedDescription += `**Descrição do grupo**: ${groupInfo.description}\n`;
        embedDescription += `**Proprietário do grupo**: ${groupInfo.owner.username}\n`;
        embedDescription += `**Membros no grupo**: ${groupInfo.memberCount}\n`;
        let jrStatus = !groupInfo.publicEntryAllowed;
        embedDescription += `**Junte -se às solicitações ativadas**: ${jrStatus ? "Sim" : "Não"}`;
        let embed = client.embedMaker({ title: "Informações do grupo", description: embedDescription, type: "info", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("info")
        .setDescription("Recebe as informações do grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para obter a informação de").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups())),
    commandData: {
        category: "General Group",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
