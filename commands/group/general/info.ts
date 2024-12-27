import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let groupInfo: roblox.Group;
        try {
            groupInfo = await roblox.getGroup(groupID);
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `Houve um erro ao tentar obter as informações do grupo: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embedDescription = "";
        embedDescription += `**Descrição do grupo**: ${groupInfo.description}\n`;
        embedDescription += `**Proprietário do grupo**: ${groupInfo.owner.username}\n`;
        embedDescription += `**Membros no grupo**: ${groupInfo.memberCount}\n`;
        let jrStatus = !groupInfo.publicEntryAllowed;
        embedDescription += `**Junte -se às solicitações ativadas**: ${jrStatus ? "Sim" : "Não"}`;
        let embed = client.embedMaker({title: "Informações do grupo", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("info")
    .setDescription("Recebe as informações do grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para obter a informação de").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Group",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;