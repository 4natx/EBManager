import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10);
        if(joinRequests.data.length === 0) {
            let embed = client.embedMaker({title: "Solicitações", description: "Atualmente, não há solicitações", type: "info", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let previousPageCursor = joinRequests.previousPageCursor;
        let nextPageCursor = joinRequests.nextPageCursor;
        let embedDescription = "";
        let counter = 1;
        for(let i = 0; i < joinRequests.data.length; i++) {
            embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}\n`;
            counter++;
        }
        let embed = client.embedMaker({title: "Solicitações", description: embedDescription, type: "info", author: interaction.user});
        if(!previousPageCursor && !nextPageCursor) {
            return await interaction.editReply({embeds: [embed]});
        }
        let componentData = client.createButtons([
            {customID: "previousPage", label: "Página anterior", style: Discord.ButtonStyle.Primary},
            {customID: "nextPage", label: "Próxima página", style: Discord.ButtonStyle.Primary}
        ]);
        let msg = await interaction.editReply({embeds: [embed]}) as Discord.Message;
        let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
        let collector = msg.createMessageComponentCollector({filter: filter, time: config.collectorTime});
        collector.on('collect', async(button: Discord.ButtonInteraction) => {
            if(button.customId === "previousPage") {
                joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10, previousPageCursor);
            } else {
                joinRequests = await roblox.getJoinRequests(groupID, "Desc", 10, nextPageCursor);
            }
            previousPageCursor = joinRequests.previousPageCursor;
            nextPageCursor = joinRequests.nextPageCursor;
            let counter = 1;
            for(let i = 0; i < joinRequests.data.length; i++) {
                embedDescription += `**${counter}**: ${joinRequests.data[i].requester.username}`;
                counter++;
            }
            embed = client.embedMaker({title: "Solicitações", description: embedDescription, type: "info", author: interaction.user});
            await msg.edit({embeds: [embed]});
            await button.reply({content: "ㅤ"});
            await button.deleteReply();
        });
        collector.on('end', async() => {
            let disabledComponents = client.disableButtons(componentData).components;
            try {
                await msg.edit({components: disabledComponents});
            } catch {};
        });
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("get-join-requests")
    .setDescription("Recebe os pedidos pendentes do grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para obter as solicitações").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
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
