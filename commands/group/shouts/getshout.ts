import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let shout = await roblox.getShout(groupID);
        if(!shout) {
            let embed = client.embedMaker({title: "Sem Aviso", description: "O grupo vinculado não tem um aviso", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embedDescription = "";
        embedDescription += `**Publicador**: ${shout.poster.username}\n`;
        embedDescription += `**Corpo**: ${shout.body}\n`;
        embedDescription += `**Criada**: ${shout.created}\n`;
        let embed = client.embedMaker({title: "Aviso atual", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("getshout")
    .setDescription("Recebe o aviso de grupo atual")
    .addStringOption(o => o.setName("group").setDescription("O grupo recebe o aviso").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false,
    }
}

export default command;