"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const __1 = require("../..");
const config_1 = __importDefault(require("../../config"));
const command = {
    run: async (interaction, client, args) => {
        let helpData = {};
        for (let i = 0; i < __1.commands.length; i++) {
            let commandName = __1.commands[i].name;
            if (__1.registeredCommands.findIndex(c => c.name === commandName) === -1)
                continue;
            let slashData = __1.commands[i].slashData;
            let commandData = __1.commands[i].commandData;
            if (!helpData[commandData.category])
                helpData[commandData.category] = { commandHelpStrings: [], helpEmbed: null };
            let commandString = `**${commandName}** | ${slashData.description}`;
            helpData[commandData.category].commandHelpStrings.push(commandString);
        }
        let categories = Object.keys(helpData);
        for (let i = 0; i < categories.length; i++) {
            let embedDescription = "";
            let categoryHelpData = helpData[categories[i]];
            for (let i = 0; i < categoryHelpData.commandHelpStrings.length; i++) {
                embedDescription += `${categoryHelpData.commandHelpStrings[i]}\n`;
            }
            let embed = client.embedMaker({ title: `${categories[i]} Comandos`, description: embedDescription, type: "info", author: interaction.user });
            helpData[categories[i]].helpEmbed = embed;
        }
        let helpPageIndex = 0;
        let embed = helpData[categories[helpPageIndex]].helpEmbed;
        let componentData = client.createButtons([
            { customID: "previousPage", label: "Página anterior", style: discord_js_1.default.ButtonStyle.Primary },
            { customID: "nextPage", label: "Próxima página", style: discord_js_1.default.ButtonStyle.Primary }
        ]);
        let msg = await interaction.editReply({ embeds: [embed], components: componentData.components });
        let filter = (buttonInteraction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
        let collector = msg.createMessageComponentCollector({ filter: filter, time: config_1.default.collectorTime });
        collector.on('collect', async (button) => {
            if (button.customId === "previousPage") {
                helpPageIndex -= 1;
                if (helpPageIndex === -1)
                    helpPageIndex = categories.length - 1;
            }
            else {
                helpPageIndex += 1;
                if (helpPageIndex === categories.length)
                    helpPageIndex = 0;
            }
            embed = helpData[categories[helpPageIndex]].helpEmbed;
            await msg.edit({ embeds: [embed] });
            await button.reply({ content: "ㅤ" });
            await button.deleteReply();
        });
        collector.on('end', async () => {
            let disabledComponents = client.disableButtons(componentData).components;
            try {
                await msg.edit({ components: disabledComponents });
            }
            catch { }
            ;
        });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("help")
        .setDescription("Recebe uma lista de comandos"),
    commandData: {
        category: "Util",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
