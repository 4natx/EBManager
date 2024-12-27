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
        let message = args["message"];
        try {
            await roblox.shout(groupID, message);
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Erro", description: `Houve um erro enquanto tentava avisar a mensagem de entrada para o grupo: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Sucesso", description: "Você avisou com sucesso a mensagem inserida para o aviso de grupo", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        await client.logAction(`<@${interaction.user.id}> avisou "**${message}**" para o grupo em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("shout")
        .setDescription("Avisa uma mensagem para o grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para avisar").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("message").setDescription("A mensagem que você deseja avisar para o grupo").setRequired(true)),
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
