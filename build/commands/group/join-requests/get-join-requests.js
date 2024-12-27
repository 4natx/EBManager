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
        let joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10);
        if (joinRequests.data.length === 0) {
            let embed = client.embedMaker({ title: "Solicitações", description: "Atualmente, não há solicitações", type: "info", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let previousPageCursor = joinRequests.previousPageCursor;
        let nextPageCursor = joinRequests.nextPageCursor;
        let embedDescription = "";
        let counter = 1;
        for (let i = 0; i < joinRequests.data.length; i++) {
            embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}\n`;
            counter++;
        }
        let embed = client.embedMaker({ title: "Solicitações", description: embedDescription, type: "info", author: interaction.user });
        if (!previousPageCursor && !nextPageCursor) {
            return await interaction.editReply({ embeds: [embed] });
        }
        let componentData = client.createButtons([
            { customID: "previousPage", label: "Página anterior", style: discord_js_1.default.ButtonStyle.Primary },
            { customID: "nextPage", label: "Próxima página", style: discord_js_1.default.ButtonStyle.Primary }
        ]);
        let msg = await interaction.editReply({ embeds: [embed] });
        let filter = (buttonInteraction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
        let collector = msg.createMessageComponentCollector({ filter: filter, time: config_1.default.collectorTime });
        collector.on('collect', async (button) => {
            if (button.customId === "previousPage") {
                joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10, previousPageCursor);
            }
            else {
                joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10, nextPageCursor);
            }
            previousPageCursor = joinRequests.previousPageCursor;
            nextPageCursor = joinRequests.nextPageCursor;
            let counter = 1;
            for (let i = 0; i < joinRequests.data.length; i++) {
                embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}`;
                counter++;
            }
            embed = client.embedMaker({ title: "Solicitações", description: embedDescription, type: "info", author: interaction.user });
            await msg.edit({ embeds: [embed] });
            await button.reply({ content: "ㅤ" });
            await button.deleteReply();
        });
        collector.on('end', async () => {
            let disabledComponents = client.disableButtons(componentData).components;
            try {
                await msg.edit({ components: disabledComponents });
            }
            catch { }
            ;
        });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("get-join-requests")
        .setDescription("Recebe os pedidos pendentes do grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para obter as solicitações").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups())),
    commandData: {
        category: "Join Request",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.joinrequests,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "JoinRequests"
    }
};
exports.default = command;
