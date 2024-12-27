import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        try {
            await roblox.shout(groupID, "");
        } catch(e) {
            let embed = client.embedMaker({title: "Erro", description: `Houve um erro ao tentar limpar o aviso do grupo: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Sucesso", description: "Você limpou com sucesso o aviso do grupo", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> limpou o aviso do grupo **${GroupHandler.getNameFromID(groupID)}**`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("clearshout")
    .setDescription("Limpa o aviso do grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para limpar o aviso").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        isEphemeral: false,
        permissions: config.permissions.group.shout,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Shouts"
    }
}

export default command;