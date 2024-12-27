"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const ConfigHelpers_1 = __importDefault(require("../../utils/classes/ConfigHelpers"));
const config_1 = __importDefault(require("../../config"));
const command = {
    run: async (interaction, client, args) => {
        let permissionNode = args["permission"];
        let role = args["role"];
        let subcommand = args["subcommand"];
        let permissionArray = ConfigHelpers_1.default.getPropertyFromString(config_1.default.permissions, permissionNode);
        if (!permissionArray) {
            let embed = client.embedMaker({ title: "Permissão inválida", description: "Você forneceu uma permissão inválida", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let index = permissionArray.indexOf(role);
        if (subcommand === "add") {
            if (index !== -1) {
                let embed = client.embedMaker({ title: "Permissão já concedida", description: "Esta função já tem a permissão fornecida", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            permissionArray.push(role);
        }
        else if (subcommand === "remove") {
            if (index === -1) {
                let embed = client.embedMaker({ title: "Permissão não concedida", description: "Esta função não tem a permissão fornecida", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            permissionArray.splice(index, 1);
        }
        else {
            if (permissionArray.length === 0 || (permissionArray.length === 1 && permissionArray[0] === "")) {
                let embed = client.embedMaker({ title: "Sem funções de permissão", description: "A permissão fornecida não tem funções explicitamente definidas para isso", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            let description = `Estes são as funções que têm a permissão fornecida\n\n`;
            for (let i = 0; i < permissionArray.length; i++) {
                description += `<@&${permissionArray[i]}>\n`;
            }
            let embed = client.embedMaker({ title: "Funções", description: description, type: "info", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        ConfigHelpers_1.default.setPropertyFromString(config_1.default, permissionNode, permissionArray);
        ConfigHelpers_1.default.setPropertyFromString(config_1.default, permissionNode, permissionArray);
        ConfigHelpers_1.default.writeToConfigFile(client);
        let embed = client.embedMaker({ title: "Permissões modificadas com sucesso", description: `Você modificou com sucesso esta permissão para ${subcommand} a função fornecida`, type: "success", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    autocomplete: async (interaction, client) => {
        let strings = ConfigHelpers_1.default.getObjectStrings(config_1.default.permissions);
        let focused = interaction.options.getFocused();
        let filtered = strings.filter(choice => choice.startsWith(focused));
        return await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
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
    }),
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
