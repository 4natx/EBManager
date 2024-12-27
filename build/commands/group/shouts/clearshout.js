"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        try {
            await roblox.shout(groupID, "");
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Erro", description: `Houve um erro ao tentar limpar o aviso do grupo: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Sucesso", description: "Você limpou com sucesso o aviso do grupo", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        await client.logAction(`<@${interaction.user.id}> limpou o aviso do grupo **${GroupHandler_1.default.getNameFromID(groupID)}**`);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("clearshout")
        .setDescription("Limpa o aviso do grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para limpar o aviso").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups())),
    commandData: {
        category: "Shout",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.shout,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Shouts"
    }
};
exports.default = command;
