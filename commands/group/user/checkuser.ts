import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import GroupHandler from '../../../utils/classes/GroupHandler';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import GroupBanEntry from '../../../utils/interfaces/GroupBanEntry';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

function formatWarnDate(date: Date): string {
    let hour = date.getHours();
    let isAM = false;
    if(hour === 0) {
        hour = 12;
        isAM = true;
    } else if(hour === 12) {
        isAM = false;
    } else {
        if(hour < 12) {
            isAM = true;
        } else {
            hour -= 12;
        }
    }
    let mins = `${date.getMinutes()}`;
    if(mins.length === 1) mins = `0${mins}`;
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${hour}:${mins} ${isAM ? "AM" : "PM"}`;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let robloxID = await roblox.getIdFromUsername(username) as number;
        if(!robloxID) {
            let embed = client.embedMaker({title: "Nome de usuário Inválido", description: "O nome de usuário fornecido é um nome de usuário Roblox inválido", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(robloxID);
        let groupDataValue;
        let gameDataValue;
        if(config.universes.length !== 0) {
            let universeName = args["universe"];
            let universeID = UniverseHandler.getIDFromName(universeName);
            let res = await RobloxDatastore.getModerationData(universeID, robloxID);
            if(res.err) {
                let embed = client.embedMaker({title: "Erro", description: `Houve um erro ao tentar buscar os dados de moderação do usuário: ${res.err}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let moderationData = res.data;
            let warnsString = "Houve len avisos encontrados para este usuário\n\n";
            if(moderationData.warns) {
                if(moderationData.warns.length === 0) {
                    warnsString = "Sem avisos presentes";
                } else {
                    if(moderationData.warns.length === 1) warnsString = "Houve 1 aviso encontrado para este usuário\n\n";
                    for(let i = 0; i < moderationData.warns.length; i++) {
                        warnsString += `Autor: ${moderationData.warns[i].author} | Motivo: ${moderationData.warns[i].reason} | Data atribuída: ${formatWarnDate(new Date(moderationData.warns[i].dateAssigned))}\n`;
                    }
                    warnsString = warnsString.replace("len", moderationData.warns.length.toString());
                }
            }
            gameDataValue = "```\nO usuário está banido: <ban status>\nO usuário está silenciado: <mute status>\nAvisos: <warnings>```"
            .replace("<ban status>", (typeof(moderationData) === "string" ? "Incapaz de carregar" : moderationData.banData.isBanned ? `Sim\nMotivo Ban: ${moderationData.banData.reason}` : "Não"))
            .replace("<mute status>", (typeof(moderationData) === "string" ? "Incapaz de carregar" : moderationData.muteData.isMuted ? `Sim\nMotivo Mute: ${moderationData.muteData.reason}` : "Não"))
            gameDataValue = gameDataValue.replace("<warnings>", (typeof(moderationData) === "string" ? "Incapaz de carregar" : moderationData.warns ? moderationData.warns.length === 0 ? "Sem avisos presentes" : warnsString : "Sem avisos presentes"))
        }
        if(config.groupIds.length !== 0) {
            let groupID = GroupHandler.getIDFromName(args["group"]);
            let bannedUsers = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanEntry[];
            let suspendedUsers = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
            let bannedIndex = bannedUsers.findIndex(v => v.groupID === groupID && v.userID === robloxID);
            let isGroupBanned = (bannedIndex !== -1);
            let suspendedIndex = suspendedUsers.findIndex(v => v.groupID === groupID && v.userId === robloxID);
            let isSuspended = (suspendedIndex !== -1);
            let extraGroupData = "O usuário é suspenso: não";
            if(isSuspended) {
                let oldRole = (await roblox.getRoles(groupID)).find(v => v.id === suspendedUsers[suspendedIndex].oldRoleID).name;
                let time = suspendedUsers[suspendedIndex].timeToRelease - Date.now() as any;
                if(time <= 0) {
                    time = "Oficialmente, esse usuário não está mais suspenso, o próximo cheque de suspensão excluirá seu registro do banco de dados"
                } else {
                    time = ms(time, {long: true})
                }
                extraGroupData = `Usuário é suspenso: sim\nRazão da suspensão: ${suspendedUsers[suspendedIndex].reason}\nSuspenso de: ${oldRole}\nSuspenso para: ${time}`;
            }
            groupDataValue = "```\nNome do rank: <rank name>\nRank ID: <rank id>\nUsuário banido do grupo: <ban status>\n<extra>```"
            .replace("<rank name>", await roblox.getRankNameInGroup(groupID, robloxID))
            .replace("<rank id>", (await roblox.getRankInGroup(groupID, robloxID)).toString())
            .replace("<ban status>", isGroupBanned ? "Sim" : "Não")
            .replace("<extra>", extraGroupData)
        }
        let embed = client.embedMaker({title: "Informação", description: "", type: "info", author: interaction.user});
        embed.addFields({
            name: "User Data",
            value: "```\nNome de usuário: <username>\nRoblox ID: <id>\n```"
            .replace("<username>", username)
            .replace("<id>", `${robloxID}`)
        });
        if(groupDataValue) {
            embed.addFields({
                name: "Group Data",
                value: groupDataValue
            });
        }
        if(gameDataValue) {
            embed.addFields({
                name: "Game Data",
                value: gameDataValue
            });
        }
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Obtenha informações sobre o usuário inserido")
    .addStringOption(o => o.setName("username").setDescription("O nome de usuário do usuário que você deseja verificar").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config.permissions.group.user,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

if(config.groupIds.length !== 0) {
    command.slashData.addStringOption(o => o.setName("group").setDescription("The group to check the user's group data in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
}

if(config.universes.length !== 0) {
    command.slashData.addStringOption(o => o.setName("universe").setDescription("The universe to check the user's moderation status on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
}

export default command;