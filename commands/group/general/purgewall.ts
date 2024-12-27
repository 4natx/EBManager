import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

async function deleteWallPost(groupID: number, postID: number) {
    let res = await BotClient.request({
        url: `https://groups.roblox.com/v1/groups/${groupID}/wall/posts/${postID}`,
        method: "DELETE",
        headers: {},
        body: {},
        robloxRequest: true
    });
    let body = await res.json();
    if(res.status !== 200) {
        throw new Error(body);
    }
}

async function deletePosts(groupID: number, amount: number, userID?: number): Promise<{success: number, failed: number, err?: string}> {
    let success = 0;
    let failed = 0;
    let page: roblox.WallPostPage;
    try {
        page = await roblox.getWall(groupID, "Desc", 100);
        page.data = page.data.filter(p => p.poster); // Filter because there seems to be a bug where deleted posts have their poster field as null
    } catch(e) {
        return {success: success, failed: failed, err: e};
    }
    let cursor = page.nextPageCursor;
    while(success + failed < amount) {
        let shouldBreakWhileLoop = false;
        for(let i = 0; i < page.data.length; i++) {
            let post = page.data[i];
            let shouldDelete = false;
            if(userID) {
                if((post.poster as any).user.userId === userID) shouldDelete = true;
            } else {
                shouldDelete = true;
            }
            if(shouldDelete) {
                try {
                    await deleteWallPost(groupID, post.id);
                    success++;
                } catch(e) {
                    console.log(e);
                    failed++;
                }
            }
            if(success + failed >= amount) {
                shouldBreakWhileLoop = true;
                break; // Break out of this for loop
            }
        }
        if(!cursor) shouldBreakWhileLoop = true;
        if(shouldBreakWhileLoop) break;
        try {
            page = await roblox.getWall(groupID, "Desc", 100, cursor);
            page.data = page.data.filter(p => p.poster);
            cursor = page.nextPageCursor;
        } catch(e) {
            return {success: success, failed: failed, err: e};
        }
    }
    return {success: success, failed: failed};
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let subcommand = args["subcommand"];
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let username = args["username"];
        let amount = args["amount"];
        let userID: number;
        if(username) {
            userID = await roblox.getIdFromUsername(username) as number;
            if(!userID) {
                let embed = client.embedMaker({title: "Nome de usuário Inválido", description: "O nome de usuário que você forneceu é inválido", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            username = await roblox.getUsernameFromId(userID);
        }
        if(subcommand === "user") {
            amount = Number.MAX_VALUE;
        }
        let embed = client.embedMaker({title: "Excluindo postagens", description: "Dependendo de quantas postagens existem, isso pode levar até alguns milissegundos a alguns minutos", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let deleteResult = await deletePosts(groupID, amount, userID);
        let embedDescription = "";
        if(deleteResult.err) {
            embedDescription = `Ao excluir, houve um erro ao tentar buscar as postagens: ${deleteResult.err}. Eu excluí com sucesso **${deleteResult.success}** postagens e falhou em excluir **${deleteResult.failed}** postagens`;
        } else {
            if(deleteResult.failed === 0) {
                embedDescription = `Eu excluí com sucesso **${deleteResult.success}** Postagens sem erros`;
            } else {
                embedDescription = `Eu excluí com sucesso **${deleteResult.success}** postagens e falhou em excluir **${deleteResult.failed}** Postagens`;
            }
        }
        embed = client.embedMaker({title: "Results", description: embedDescription, type: "info", author: interaction.user});
        await interaction.editReply({content: `<@${interaction.user.id}>`, embeds: [embed]});
        let logString = `<@${interaction.user.id}> excluiu mensagens da parede do grupo. Eles excluíram com sucesso **${deleteResult.success}** Postagens`;
        if(userID) {
            logString += ` by **${username}**`;
        }
        logString += ` e não excluiu **${deleteResult.failed}** Postagens`;
        if(deleteResult.err) {
            logString += `\n\nHouve um erro ao tentar buscar algumas postagens: ${deleteResult.err}`;
        }
        await client.logAction(logString);
        return deleteResult.success;
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName("purgewall")
    .setDescription("Limpar a parede por usuário, quantidade ou ambos")
    .addSubcommand(sc => {
        sc.setName("user");
        sc.setDescription("Exclui todas as postagens de parede pelo usuário inserido");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler.parseGroups() as any));
        sc.addStringOption(o => o.setName("username").setDescription("O nome de usuário do usuário para excluir as postagens").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("amount");
        sc.setDescription("Exclui uma certa quantidade de postagens da parede");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler.parseGroups() as any));
        sc.addNumberOption(o => o.setName("amount").setDescription("A quantidade de postagens para excluir").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("both");
        sc.setDescription("Exclui uma certa quantidade de postagens de parede por um usuário");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler.parseGroups() as any));
        sc.addStringOption(o => o.setName("username").setDescription("O nome de usuário do usuário para excluir as postagens").setRequired(true));
        sc.addNumberOption(o => o.setName("amount").setDescription("A quantidade de postagens para excluir").setRequired(true));
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Group",
        isEphemeral: false,
        permissions: config.permissions.group.wall,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Wall"
    }
}

export default command;
