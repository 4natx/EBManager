import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `Você inseriu uma quantidade desigual de nomes de usuário e razões, verifique se esses valores são iguais ou, se desejar aplicar um motivo a várias pessoas, apenas coloque esse motivo para o argumento do motivo`, type: "error", author: interaction.user})
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
                let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Ranking", victimRobloxID);
                if(!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `As verificações falharam, motivo: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let suspensions = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
            let index = suspensions.findIndex(v => v.userId === victimRobloxID);
            if(index != -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Este usuário está atualmente suspenso"
                });
                continue;
            }
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário fornecido não está no grupo"
                });
                continue;
            }
            let roles = await roblox.getRoles(groupID);
            let currentRoleIndex = roles.findIndex(role => role.rank === rankID);
            let currentRole = roles[currentRoleIndex];
            let potentialRole = roles[currentRoleIndex + 1];
            let botRank = await roblox.getRankInGroup(groupID, client.robloxInfo.UserID);
            if(potentialRole.rank >= botRank) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "A próxima classificação do usuário fornecida é igual ou superior à classificação da conta do bot"
                });
                continue;
            }
            let oldRoleName = currentRole.name;
            let lockedRank = false;
            if(client.isLockedRole(potentialRole)) {
                lockedRank = true;
                let shouldBreakAfterForLoop = false;
                for(let i = currentRoleIndex + 1; i < roles.length; i++) {
                    potentialRole = roles[i];
                    if(potentialRole.rank === botRank) {
                        logs.push({
                            username: username,
                            status: "Error",
                            message: "Todas as funções acima do usuário fornecido estão bloqueadas"
                        });
                        shouldBreakAfterForLoop = true;
                    }
                    if(!client.isLockedRole(potentialRole)) break;
                }
                if(shouldBreakAfterForLoop) continue; // If I call continue in the nested for loop (the one right above this line), it won't cause the main username for loop to skip over the rest of the code
            }
            if(lockedRank) {
                let shouldContinue = false;
                let embed = client.embedMaker({title: "Cargo Trancado", description: `O (s) cargo (s) acima **${username}** está trancado, você gostaria de promover **${username}** para **${potentialRole.name}**?`, type: "info", author: interaction.user});
                let componentData = client.createButtons([
                    {customID: "yesButton", label: "Sim", style: Discord.ButtonStyle.Success},
                    {customID: "noButton", label: "Não", style: Discord.ButtonStyle.Danger}
                ]);
                let msg = await interaction.editReply({embeds: [embed], components: componentData.components}) as Discord.Message;
                let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
                let button = (await msg.awaitMessageComponent({filter: filter, time: config.collectorTime}));
                if(button) {
                    if(button.customId === "yesButton") {
                        shouldContinue = true;
                        await button.reply({content: "ㅤ"});
                        await button.deleteReply();
                    }
                } else {
                    let disabledComponents = client.disableButtons(componentData).components;
                    await msg.edit({components: disabledComponents});
                }
                if(!shouldContinue) {
                    logs.push({
                        username: username,
                        status: "Cancelled",
                    });
                    continue;
                }
            }
            try {
                await roblox.setRank(groupID, victimRobloxID, potentialRole.rank);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> promoveu **${username}** de **${oldRoleName}** para **${potentialRole.name}** pelo motivo de **${reason}** em **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promove o (s) usuário (s) inserido (s)")
    .addStringOption(o => o.setName("group").setDescription("O grupo para fazer a promoção").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja promover").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) do (s) promoção (s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        permissions: config.permissions.group.ranking,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Ranking"
    }
}

export default command;