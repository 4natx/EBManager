import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

async function batchDeny(groupID: number, userIDS: Number[]): Promise<void> {
    let res = await BotClient.request({
        url: `https://groups.roblox.com/v1/groups/${groupID}/join-requests`,
        method: "DELETE",
        headers: {},
        body: {
            "UserIds": userIDS
        },
        robloxRequest: true
    });
    let body = await res.json();
    if(body.errors) {
        throw new Error(body.errors[0].message);
    }
}

function parseUsers(users: roblox.GroupJoinRequest[]): Number[] {
    let userIDs = [];
    for(let i = 0; i < users.length; i++) {
        userIDs.push(users[i].requester.userId);
    }
    return userIDs;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let reason = args["reason"];
        let joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100);
        if(joinRequests.data.length === 0) {
            let embed = client.embedMaker({title: "Sem solicitações", description: "Atualmente, não há solicitações pendentes", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Processando solicitações", description: "Atualmente, processando as solicitações, seja paciente. Você será marcado assim que o processo for feito", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let nextCursor = joinRequests.nextPageCursor;
        await client.logAction(`<@${interaction.user.id}> começou a negar todos os pedidos no grupo pelo motivo **${reason}** em **${GroupHandler.getNameFromID(groupID)}**`);
        try {
            await batchDeny(groupID, parseUsers(joinRequests.data));
        } catch(e) {
            let embed = client.embedMaker({title: "Erro", description: `Houve um erro ao tentar negar as solicitações: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        while(nextCursor) {
            joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100, nextCursor);
            nextCursor = joinRequests.nextPageCursor;
            try {
                await batchDeny(groupID, parseUsers(joinRequests.data));
            } catch(e) {
                let embed = client.embedMaker({title: "Erro", description: `Houve um erro ao tentar negar as solicitações: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        embed = client.embedMaker({title: "Sucesso", description: "Você negou com sucesso todos os pedidos no grupo", type: "success", author: interaction.user});
        await interaction.editReply({content: `<@${interaction.user.id}>`, embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("deny-all-requests")
    .setDescription("Nega todas as solicitações pendentes")
    .addStringOption(o => o.setName("group").setDescription("O grupo para negar todas as solicitações").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("reason").setDescription("A razão pela qual você está negando todos esses pedidos").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        isEphemeral: false,
        permissions: config.permissions.group.joinrequests,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "JoinRequests"
    }
}

export default command;