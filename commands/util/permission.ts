import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';
import ConfigHelpers from '../../utils/classes/ConfigHelpers';

import CommandFile from '../../utils/interfaces/CommandFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let permissionNode = args["permission"];
        let role = args["role"];
        let subcommand = args["subcommand"];
        let permissionArray = ConfigHelpers.getPropertyFromString(config.permissions, permissionNode) as string[];
        if(!permissionArray) {
            let embed = client.embedMaker({title: "Permissão inválida", description: "Você forneceu uma permissão inválida", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let index = permissionArray.indexOf(role);
        if(subcommand === "add") {
            if(index !== -1) {
                let embed = client.embedMaker({title: "Permissão já concedida", description: "Esta função já tem a permissão fornecida", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            permissionArray.push(role);
        } else if(subcommand === "remove") {
            if(index === -1) {
                let embed = client.embedMaker({title: "Permissão não concedida", description: "Esta função não tem a permissão fornecida", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            permissionArray.splice(index, 1);
        } else {
            if(permissionArray.length === 0 || (permissionArray.length === 1 && permissionArray[0] === "")) {
                let embed = client.embedMaker({title: "Sem funções de permissão", description: "A permissão fornecida não tem funções explicitamente definidas para isso", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let description = `Estes são as funções que têm a permissão fornecida\n\n`;
            for(let i = 0; i < permissionArray.length; i++) {
                description += `<@&${permissionArray[i]}>\n`;
            }
            let embed = client.embedMaker({title: "Funções", description: description, type: "info", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        ConfigHelpers.setPropertyFromString(config, permissionNode, permissionArray);
        ConfigHelpers.setPropertyFromString(config, permissionNode, permissionArray);
        ConfigHelpers.writeToConfigFile(client);
        let embed = client.embedMaker({title: "Permissões modificadas com sucesso", description: `Você modificou com sucesso esta permissão para ${subcommand} a função fornecida`, type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    autocomplete: async(interaction: Discord.AutocompleteInteraction, client: BotClient): Promise<any> => {
        let strings = ConfigHelpers.getObjectStrings(config.permissions);
        let focused = interaction.options.getFocused();
        let filtered = strings.filter(choice => choice.startsWith(focused));
        return await interaction.respond(filtered.map(choice => ({name: choice, value: choice})));
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("permission")
    .setDescription("Configura permissões de função para o bot")
    .addSubcommand(sc => {
        sc.setName("add");
        sc.setDescription("Adiciona uma função permitida ao bot");
        sc.addStringOption(o => o.setName("permission").setDescription("A configuração de permissão para modificar").setRequired(true).setAutocomplete(true));
        sc.addRoleOption(o => o.setName("role").setDescription("A função para dar a permissão").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("remove");
        sc.setDescription("Remove uma função permitida ao bot");
        sc.addStringOption(o => o.setName("permission").setDescription("A configuração de permissão para modificar").setRequired(true).setAutocomplete(true));
        sc.addRoleOption(o => o.setName("role").setDescription("A função para dar a permissão").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("list");
        sc.setDescription("Lista as funções que têm a permissão fornecida");
        sc.addStringOption(o => o.setName("permission").setDescription("A configuração de permissão para listar as funções").setRequired(true).setAutocomplete(true));
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;