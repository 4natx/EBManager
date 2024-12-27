import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let ranks = await roblox.getRoles(groupID);
        let description = "";
        for(let i = 1; i < ranks.length; i++) {
            if(client.isLockedRole(ranks[i])) {
                description += `**ID**: ${ranks[i].rank} | **Rank**: ${ranks[i].name} | [TRANCADO]\n`;
            } else {
                description += `**ID**: ${ranks[i].rank} | **Rank**: ${ranks[i].name}\n`;
            }
        }
        let embed = client.embedMaker({title: "Ranks no grupo", description: description, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("getranks")
    .setDescription("Recebe os ranks do grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para obter os ranks").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;