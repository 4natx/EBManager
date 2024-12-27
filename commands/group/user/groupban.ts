import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';
import BetterConsole from '../../../utils/classes/BetterConsole';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import GroupBanEntry from '../../../utils/interfaces/GroupBanEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Erro de argumento", description: `Você inseriu uma quantidade desigual de nomes de usuário e razões, verifique se esses valores são iguais ou, se desejar aplicar um motivo a várias pessoas, apenas coloque esse motivo para o argumento do motivo`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let victimRobloxID = await roblox.getIdFromUsername(username) as number;
            if(!victimRobloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O nome de usuário fornecido é um nome de usuário Roblox inválido"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Exile", victimRobloxID);
                if(!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `As verificações falharam, motivo: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let bannedUsers = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanEntry[];
            let index = bannedUsers.findIndex(v => v.groupID === groupID && v.userID === victimRobloxID);
            if(index !== -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário fornecido já está banido do grupo"
                });
                continue;
            }
            bannedUsers.push({groupID: groupID, userID: victimRobloxID});
            await fs.promises.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID !== 0) {
                try {
                    await roblox.exile(groupID, victimRobloxID);
                } catch(e) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `Embora este usuário agora esteja banido do grupo, eles não foram exilados devido ao seguinte erro: ${e}`
                    });
                }
            } else {
                if(config.ban.banDiscordAccounts) {
                    let discordIDs = await VerificationHelpers.getDiscordUsers(interaction.guild.id, victimRobloxID);
                    BetterConsole.log(`Fetected Discord IDs for Roblox ID ${victimRobloxID}: ${discordIDs}`);
                    let didDiscordBanError = false;
                    for(let i = 0; i < discordIDs.length; i++) {
                        try {
                            await interaction.guild.members.ban(discordIDs[i], {reason: reason});
                        } catch(e) {
                            didDiscordBanError = true;
                            logs.push({
                                username: `<@${discordIDs[i]}>`,
                                status: "Error",
                                message: `Embora esse usuário agora esteja banido do grupo, eles não foram banidos do discord devido ao seguinte erro: ${e}`
                            });
                        }
                    }
                    if(!didDiscordBanError) {
                        logs.push({
                            username: username,
                            status: "Success"
                        });
                    }
                }
            }
            await client.logAction(`<@${interaction.user.id}> baniu **${username}** do grupo pelo motivo de **${reason}** de **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("groupban")
    .setDescription("Bane os usuários (s) fornecidos (s) do grupo")
    .addStringOption(o => o.setName("group").setDescription("O grupo para banir").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja banir do grupo").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) dos bans").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config.permissions.group.user,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Exile"
    }
}

export default command;