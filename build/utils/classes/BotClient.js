"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const noblox_js_1 = __importDefault(require("noblox.js"));
const BetterConsole_1 = __importDefault(require("./BetterConsole"));
const config_1 = __importDefault(require("../../config"));
class BotClient extends discord_js_1.default.Client {
    constructor(config) {
        super({ intents: [discord_js_1.default.IntentsBitField.Flags.Guilds, discord_js_1.default.IntentsBitField.Flags.GuildMessages, discord_js_1.default.IntentsBitField.Flags.GuildMessageReactions, discord_js_1.default.IntentsBitField.Flags.MessageContent] });
        this.originalLockedCommands = [];
        this.commandCooldowns = [];
        this.groupLogs = [];
        this.verificationCache = [];
        this.jobIdsRequested = [];
        this.originalLockedCommands = config.lockedCommands;
    }
    static async request(requestOptions) {
        if (requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await noblox_js_1.default.getGeneralToken(),
                "Cookie": `.ROBLOSECURITY=${config_1.default.ROBLOX_COOKIE}`,
                ...requestOptions.headers
            };
        }
        BetterConsole_1.default.log(requestOptions);
        return await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: JSON.stringify(requestOptions.body)
        });
    }
    embedMaker(embedOptions) {
        let embed = new discord_js_1.default.EmbedBuilder();
        embed.setAuthor({ name: embedOptions.author.tag, iconURL: embedOptions.author.displayAvatarURL() });
        embed.setColor(config_1.default.embedColors[embedOptions.type]);
        if (embedOptions.description.length > 0) {
            embed.setDescription(embedOptions.description);
        }
        embed.setFooter({ text: "Created by natx." });
        embed.setTitle(embedOptions.title);
        return embed;
    }
    setStatusActivity() {
        let version = "On Latest Version? ❌";
        let roblox = "Logged Into Roblox? ❌";
        if (this.onLatestVersion) {
            version = "On Latest Version? ✅";
        }
        if (this.isLoggedIn) {
            roblox = "Logged Into Roblox? ✅";
        }
        this.user.setActivity('Federação Exército Brasileiro');
    }
    createButtons(buttonData) {
        let components = [];
        for (let i = 0; i < buttonData.length; i++) {
            let newComponent = new discord_js_1.default.ActionRowBuilder().addComponents(new discord_js_1.default.ButtonBuilder().setCustomId(buttonData[i].customID).setLabel(buttonData[i].label).setStyle(buttonData[i].style));
            components.push(newComponent);
        }
        return { components: components };
    }
    disableButtons(componentData) {
        let components = [];
        let oldComponents = componentData.components;
        for (let i = 0; i < oldComponents.length; i++) {
            let actionRow = oldComponents[i];
            actionRow.components[0].setDisabled(true);
            components.push(actionRow);
        }
        return { components: components };
    }
    async logAction(logString) {
        if (!config_1.default.logging.command.enabled)
            return;
        let embed = this.embedMaker({ title: "Commando Executado", description: logString, type: "info", author: this.user });
        let channel = await this.channels.fetch(config_1.default.logging.command.loggingChannel);
        if (channel) {
            try {
                await channel.send({ embeds: [embed] });
            }
            catch (e) {
                console.error(`There was an error while trying to log a command execution to the command logging channel: ${e}`);
            }
        }
    }
    async logXPAction(title, logString) {
        if (!config_1.default.logging.xp.enabled)
            return;
        let embed = this.embedMaker({ title: title, description: logString, type: "info", author: this.user });
        let channel = await this.channels.fetch(config_1.default.logging.xp.loggingChannel);
        if (channel) {
            try {
                await channel.send({ embeds: [embed] });
            }
            catch (e) {
                console.error(`There was an error while trying to log a XP system operation to the XP system logging channel: ${e}`);
            }
        }
    }
    createLogEmbeds(author, logs) {
        let embeds = [];
        let masterDescription = "";
        let pageCount = 1;
        for (let i = 0; i < logs.length; i++) {
            let logObject = logs[i];
            if (i === 0) {
                if (logObject.status === "Error") {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                }
                else {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: Operation ${logObject.status}\n`;
                }
            }
            else if (i % 10 !== 0) {
                if (logObject.status === "Error") {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                }
                else {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: Operation ${logObject.status}\n`;
                }
            }
            else {
                let embed = this.embedMaker({ title: `Logs (Página ${pageCount})`, description: masterDescription, type: "info", author: author });
                embeds.push(embed);
                masterDescription = "";
                pageCount++;
            }
        }
        let embed = this.embedMaker({ title: `Logs (Página ${pageCount})`, description: masterDescription, type: "info", author: author });
        embeds.push(embed);
        masterDescription = "";
        return embeds;
    }
    async initiateLogEmbedSystem(interaction, logs) {
        let logEmbeds = this.createLogEmbeds(interaction.user, logs);
        if (logEmbeds.length === 1) {
            return await interaction.editReply({ embeds: [logEmbeds[0]], components: [] });
        }
        else {
            let index = 0;
            let embed = logEmbeds[index];
            let componentData = this.createButtons([
                { customID: "backButton", label: "Página anterior", style: discord_js_1.default.ButtonStyle.Success },
                { customID: "forwardButton", label: "Próxima página", style: discord_js_1.default.ButtonStyle.Danger }
            ]);
            let msg = await interaction.editReply({ embeds: [embed], components: componentData.components });
            let filter = (buttonInteraction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let collector = msg.createMessageComponentCollector({ filter: filter, time: config_1.default.collectorTime });
            collector.on("collect", async (button) => {
                if (button.customId === "backButton") {
                    index -= 1;
                    if (index < 0) {
                        index = logEmbeds.length - 1;
                    }
                }
                else {
                    index++;
                    if (index === logEmbeds.length) {
                        index = 0;
                    }
                }
                embed = logEmbeds[index];
                await msg.edit({ embeds: [embed] });
            });
            collector.on("end", async () => {
                let disabledComponents = this.disableButtons(componentData).components;
                try {
                    await msg.edit({ components: disabledComponents });
                }
                catch { }
                ;
            });
        }
    }
    isLockedRole(role) {
        let isLocked = false;
        if (config_1.default.lockedRanks.findIndex(lockedRank => lockedRank === role.name) !== -1)
            isLocked = true;
        if (config_1.default.lockedRanks.findIndex(lockedRank => lockedRank === role.rank) !== -1)
            isLocked = true;
        return isLocked;
    }
    isUserOnCooldown(commandName, userID) {
        return (this.commandCooldowns.findIndex(v => v.commandName === commandName && v.userID === userID)) !== -1;
    }
    getCooldownForCommand(commandName) {
        return config_1.default.cooldownOverrides[commandName] || config_1.default.defaultCooldown;
    }
}
exports.default = BotClient;
