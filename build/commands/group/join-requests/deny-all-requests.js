"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const BotClient_1 = __importDefault(require("../../../utils/classes/BotClient"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
async function batchDeny(groupID, userIDS) {
    let res = await BotClient_1.default.request({
        url: `https://groups.roblox.com/v1/groups/${groupID}/join-requests`,
        method: "DELETE",
        headers: {},
        body: {
            "UserIds": userIDS
        },
        robloxRequest: true
    });
    let body = await res.json();
    if (body.errors) {
        throw new Error(body.errors[0].message);
    }
}
function parseUsers(users) {
    let userIDs = [];
    for (let i = 0; i < users.length; i++) {
        userIDs.push(users[i].requester.userId);
    }
    return userIDs;
}
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let reason = args["reason"];
        let joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100);
        if (joinRequests.data.length === 0) {
            let embed = client.embedMaker({ title: "Sem solicitações", description: "Atualmente, não há solicitações pendentes", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Processando solicitações", description: "Atualmente, processando as solicitações, seja paciente. Você será marcado assim que o processo for feito", type: "info", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        let nextCursor = joinRequests.nextPageCursor;
        await client.logAction(`<@${interaction.user.id}> começou a negar todos os pedidos no grupo pelo motivo **${reason}** em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        try {
            await batchDeny(groupID, parseUsers(joinRequests.data));
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Erro", description: `Houve um erro ao tentar negar as solicitações: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        while (nextCursor) {
            joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100, nextCursor);
            nextCursor = joinRequests.nextPageCursor;
            try {
                await batchDeny(groupID, parseUsers(joinRequests.data));
            }
            catch (e) {
                let embed = client.embedMaker({ title: "Erro", description: `Houve um erro ao tentar negar as solicitações: ${e}`, type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        embed = client.embedMaker({ title: "Sucesso", description: "Você negou com sucesso todos os pedidos no grupo", type: "success", author: interaction.user });
        await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("deny-all-requests")
        .setDescription("Nega todas as solicitações pendentes")
        .addStringOption(o => o.setName("group").setDescription("O grupo para negar todas as solicitações").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("reason").setDescription("A razão pela qual você está negando todos esses pedidos").setRequired(true)),
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
