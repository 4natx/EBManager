"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const BotClient_1 = __importDefault(require("../../../utils/classes/BotClient"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
async function deleteWallPost(groupID, postID) {
    let res = await BotClient_1.default.request({
        url: `https://groups.roblox.com/v1/groups/${groupID}/wall/posts/${postID}`,
        method: "DELETE",
        headers: {},
        body: {},
        robloxRequest: true
    });
    let body = await res.json();
    if (res.status !== 200) {
        throw new Error(body);
    }
}
async function deletePosts(groupID, amount, userID) {
    let success = 0;
    let failed = 0;
    let page;
    try {
        page = await roblox.getWall(groupID, "Desc", 100);
        page.data = page.data.filter(p => p.poster); // Filter because there seems to be a bug where deleted posts have their poster field as null
    }
    catch (e) {
        return { success: success, failed: failed, err: e };
    }
    let cursor = page.nextPageCursor;
    while (success + failed < amount) {
        let shouldBreakWhileLoop = false;
        for (let i = 0; i < page.data.length; i++) {
            let post = page.data[i];
            let shouldDelete = false;
            if (userID) {
                if (post.poster.user.userId === userID)
                    shouldDelete = true;
            }
            else {
                shouldDelete = true;
            }
            if (shouldDelete) {
                try {
                    await deleteWallPost(groupID, post.id);
                    success++;
                }
                catch (e) {
                    console.log(e);
                    failed++;
                }
            }
            if (success + failed >= amount) {
                shouldBreakWhileLoop = true;
                break; // Break out of this for loop
            }
        }
        if (!cursor)
            shouldBreakWhileLoop = true;
        if (shouldBreakWhileLoop)
            break;
        try {
            page = await roblox.getWall(groupID, "Desc", 100, cursor);
            page.data = page.data.filter(p => p.poster);
            cursor = page.nextPageCursor;
        }
        catch (e) {
            return { success: success, failed: failed, err: e };
        }
    }
    return { success: success, failed: failed };
}
const command = {
    run: async (interaction, client, args) => {
        let subcommand = args["subcommand"];
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let username = args["username"];
        let amount = args["amount"];
        let userID;
        if (username) {
            userID = await roblox.getIdFromUsername(username);
            if (!userID) {
                let embed = client.embedMaker({ title: "Nome de usuário Inválido", description: "O nome de usuário que você forneceu é inválido", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            username = await roblox.getUsernameFromId(userID);
        }
        if (subcommand === "user") {
            amount = Number.MAX_VALUE;
        }
        let embed = client.embedMaker({ title: "Excluindo postagens", description: "Dependendo de quantas postagens existem, isso pode levar até alguns milissegundos a alguns minutos", type: "info", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        let deleteResult = await deletePosts(groupID, amount, userID);
        let embedDescription = "";
        if (deleteResult.err) {
            embedDescription = `Ao excluir, houve um erro ao tentar buscar as postagens: ${deleteResult.err}. Eu excluí com sucesso **${deleteResult.success}** postagens e falhou em excluir **${deleteResult.failed}** postagens`;
        }
        else {
            if (deleteResult.failed === 0) {
                embedDescription = `Eu excluí com sucesso **${deleteResult.success}** Postagens sem erros`;
            }
            else {
                embedDescription = `Eu excluí com sucesso **${deleteResult.success}** postagens e falhou em excluir **${deleteResult.failed}** Postagens`;
            }
        }
        embed = client.embedMaker({ title: "Results", description: embedDescription, type: "info", author: interaction.user });
        await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
        let logString = `<@${interaction.user.id}> excluiu mensagens da parede do grupo. Eles excluíram com sucesso **${deleteResult.success}** Postagens`;
        if (userID) {
            logString += ` by **${username}**`;
        }
        logString += ` e não excluiu **${deleteResult.failed}** Postagens`;
        if (deleteResult.err) {
            logString += `\n\nHouve um erro ao tentar buscar algumas postagens: ${deleteResult.err}`;
        }
        await client.logAction(logString);
        return deleteResult.success;
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("purgewall")
        .setDescription("Limpar a parede por usuário, quantidade ou ambos")
        .addSubcommand(sc => {
        sc.setName("user");
        sc.setDescription("Exclui todas as postagens de parede pelo usuário inserido");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()));
        sc.addStringOption(o => o.setName("username").setDescription("O nome de usuário do usuário para excluir as postagens").setRequired(true));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("amount");
        sc.setDescription("Exclui uma certa quantidade de postagens da parede");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()));
        sc.addNumberOption(o => o.setName("amount").setDescription("A quantidade de postagens para excluir").setRequired(true));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("both");
        sc.setDescription("Exclui uma certa quantidade de postagens de parede por um usuário");
        sc.addStringOption(o => o.setName("group").setDescription("O grupo para fazer a exclusão").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()));
        sc.addStringOption(o => o.setName("username").setDescription("O nome de usuário do usuário para excluir as postagens").setRequired(true));
        sc.addNumberOption(o => o.setName("amount").setDescription("A quantidade de postagens para excluir").setRequired(true));
        return sc;
    }),
    commandData: {
        category: "General Group",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.wall,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Wall"
    }
};
exports.default = command;
