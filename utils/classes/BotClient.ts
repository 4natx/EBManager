import Discord from 'discord.js';
import roblox from 'noblox.js';

import BetterConsole from './BetterConsole';

import BotConfig from '../interfaces/BotConfig';
import RequestOptions from '../interfaces/RequestOptions';
import EmbedMakerOptions from '../interfaces/EmbedMakerOptions';
import CommandLog from '../interfaces/CommandLog';
import CooldownEntry from '../interfaces/CooldownEntry';
import GroupLog from '../interfaces/GroupLog';

import config from '../../config';

export default class BotClient extends Discord.Client {
    public originalLockedCommands: string[] = [];
    public isLoggedIn: boolean;
    public onLatestVersion: boolean;
    public robloxInfo: roblox.LoggedInUserData;
    public commandCooldowns: CooldownEntry[] = [];
    public groupLogs: GroupLog[] = [];
    public verificationCache: {discordID: string, robloxID: number, timeAdded: number}[] = [];
    public jobIdsRequested: {username: string, universeID: number, msgID: string, channelID: string, timeRequested: number}[] = [];

    constructor(config: BotConfig) {
        super({intents: [Discord.IntentsBitField.Flags.Guilds, Discord.IntentsBitField.Flags.GuildMessages, Discord.IntentsBitField.Flags.GuildMessageReactions, Discord.IntentsBitField.Flags.MessageContent]});
        this.originalLockedCommands = config.lockedCommands;
    }

    public static async request(requestOptions: RequestOptions) : Promise<Response> {
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": `.ROBLOSECURITY=${config.ROBLOX_COOKIE}`,
                ...requestOptions.headers
            }
        }
        BetterConsole.log(requestOptions);
        return await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: JSON.stringify(requestOptions.body)
        });
    }

    public embedMaker(embedOptions: EmbedMakerOptions): Discord.EmbedBuilder {
        let embed = new Discord.EmbedBuilder();
        embed.setAuthor({name: embedOptions.author.tag, iconURL: embedOptions.author.displayAvatarURL()});
        embed.setColor(config.embedColors[embedOptions.type]);
        if(embedOptions.description.length > 0) {
            embed.setDescription(embedOptions.description);
        }
        embed.setFooter({text: "Created by natx."});
        embed.setTitle(embedOptions.title);
        return embed;
    }

    public setStatusActivity() {
        let version = "On Latest Version? ❌";
        let roblox = "Logged Into Roblox? ❌";
        if(this.onLatestVersion) {
            version = "On Latest Version? ✅";
        }
        if(this.isLoggedIn) {
            roblox = "Logged Into Roblox? ✅";
        }
        this.user.setActivity('Federação Exército Brasileiro');
    }

    public createButtons(buttonData: {customID: string, label: string, style: Discord.ButtonStyle}[]): Discord.MessageReplyOptions {
        let components = [];
        for(let i = 0; i < buttonData.length; i++) {
            let newComponent = new Discord.ActionRowBuilder().addComponents(new Discord.ButtonBuilder().setCustomId(buttonData[i].customID).setLabel(buttonData[i].label).setStyle(buttonData[i].style));
            components.push(newComponent);
        }
        return {components: components}
    }

    public disableButtons(componentData: Discord.MessageReplyOptions): Discord.MessageReplyOptions {
        let components = [];
        let oldComponents = componentData.components;
        for(let i = 0; i < oldComponents.length; i++) {
            let actionRow = (oldComponents[i] as Discord.ActionRowBuilder);
            (actionRow.components[0] as Discord.ButtonBuilder).setDisabled(true);
            components.push(actionRow);
        }
        return {components: components}
    }

    public async logAction(logString: string): Promise<void> {
        if(!config.logging.command.enabled) return;
        let embed = this.embedMaker({title: "Commando Executado", description: logString, type: "info", author: this.user});
        let channel = await this.channels.fetch(config.logging.command.loggingChannel) as Discord.TextChannel;
        if(channel) {
            try {
                await channel.send({embeds: [embed]});
            } catch(e) {
                console.error(`There was an error while trying to log a command execution to the command logging channel: ${e}`);
            }
        }
    }

    public async logXPAction(title: string, logString: string): Promise<void> {
        if(!config.logging.xp.enabled) return;
        let embed = this.embedMaker({title: title, description: logString, type: "info", author: this.user});
        let channel = await this.channels.fetch(config.logging.xp.loggingChannel) as Discord.TextChannel;
        if(channel) {
            try {
                await channel.send({embeds: [embed]});
            } catch(e) {
                console.error(`There was an error while trying to log a XP system operation to the XP system logging channel: ${e}`);
            }
        }
    }

    public createLogEmbeds(author: Discord.User, logs: CommandLog[]): Discord.EmbedBuilder[] {
        let embeds = [];
        let masterDescription = "";
        let pageCount = 1;
        for(let i = 0; i < logs.length; i++) {
            let logObject = logs[i];
            if(i === 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: Operation ${logObject.status}\n`;
                }
            } else if(i % 10 !== 0) {
                if(logObject.status === "Error") {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: ${logObject.message.toString().replace("Error: ", "")}\n`;
                } else {
                    masterDescription += `**Nome de usuário**: ${logObject.username} | **Status**: ${logObject.status} | **Mensagem**: Operation ${logObject.status}\n`;
                }
            } else {
                let embed = this.embedMaker({title: `Logs (Página ${pageCount})`, description: masterDescription, type: "info", author: author});
                embeds.push(embed);
                masterDescription = "";
                pageCount++;
            }
        }
        let embed = this.embedMaker({title: `Logs (Página ${pageCount})`, description: masterDescription, type: "info", author: author});
        embeds.push(embed);
        masterDescription = "";
        return embeds;
    }

    public async initiateLogEmbedSystem(interaction: Discord.CommandInteraction, logs: CommandLog[]) {
        let logEmbeds = this.createLogEmbeds(interaction.user, logs);
        if(logEmbeds.length === 1) {
            return await interaction.editReply({embeds: [logEmbeds[0]], components: []});
        } else {
            let index = 0;
            let embed = logEmbeds[index];
            let componentData = this.createButtons([
                {customID: "backButton", label: "Página anterior", style: Discord.ButtonStyle.Success},
                {customID: "forwardButton", label: "Próxima página", style: Discord.ButtonStyle.Danger}
            ]);
            let msg = await interaction.editReply({embeds: [embed], components: componentData.components}) as Discord.Message;
            let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let collector = msg.createMessageComponentCollector({filter: filter, time: config.collectorTime});
            collector.on("collect", async(button) => {
                if(button.customId === "backButton") {
                    index -= 1;
                    if(index < 0) {
                        index = logEmbeds.length - 1;
                    }
                } else {
                    index++;
                    if(index === logEmbeds.length) {
                        index = 0;
                    }
                }
                embed = logEmbeds[index];
                await msg.edit({embeds: [embed]});
            });
            collector.on("end", async() => {
                let disabledComponents = this.disableButtons(componentData).components;
                try {
                    await msg.edit({components: disabledComponents});
                } catch {};
            });
        }
    }

    public isLockedRole(role: roblox.Role): boolean {
        let isLocked = false;
        if(config.lockedRanks.findIndex(lockedRank => lockedRank === role.name) !== -1) isLocked = true;
        if(config.lockedRanks.findIndex(lockedRank => lockedRank === role.rank) !== -1) isLocked = true;
        return isLocked;
    }

    public isUserOnCooldown(commandName: string, userID: string): boolean {
        return (this.commandCooldowns.findIndex(v => v.commandName === commandName && v.userID === userID)) !== -1;
    }

    public getCooldownForCommand(commandName: string): number {
        return config.cooldownOverrides[commandName] || config.defaultCooldown;
    }
}