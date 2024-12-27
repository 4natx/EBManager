import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let message = args["message"];
        try {
            await roblox.shout(groupID, message);
        } catch(e) {
            let embed = client.embedMaker({title: "Erro", description: `Houve um erro enquanto tentava avisar a mensagem de entrada para o grupo: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Sucesso", description: "Você avisou com sucesso a mensagem inserida para o aviso de grupo", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> avisou "**${message}**" para o grupo em **${GroupHandler.getNameFromID(groupID)}**`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("shout")
    .setDescription("Avisa uma mensagem para o grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para avisar").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("message").setDescription("A mensagem que você deseja avisar para o grupo").setRequired(true)) as Discord.SlashCommandBuilder,
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