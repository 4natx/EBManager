"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../../config"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const fileName = "RevertRanksData.txt";
async function logAction(msg) {
    await fs_1.default.promises.appendFile(`${process.cwd()}/${fileName}`, `${msg}\n`);
}
function getRankNameFromID(roles, roleSetID) {
    return roles.find(r => r.id === roleSetID).name;
}
function format(logDate) {
    return logDate.slice(0, logDate.indexOf("T")).split("-");
}
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let limit = parseInt(args["limit"]);
        let username = args["user"];
        let date = args["date"];
        let logDate = date;
        if (date) {
            date = date.split("/"); // 0 = month, 1 = day, 2 = year
            if (date[0].length === 1)
                date[0] = "0" + date[0];
            if (date[1].length === 1)
                date[1] = "0" + date[1];
            if (date[2].length === 2)
                date[2] = "20" + date[2];
        }
        let logs;
        let userID;
        if (username) {
            userID = await roblox.getIdFromUsername(username);
            if (!userID) {
                let embed = client.embedMaker({ title: "Nome de usuário Inválido", description: "O nome de usuário que você forneceu é inválido", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            logs = await roblox.getAuditLog(groupID, "ChangeRank", userID, "Desc", 100, "");
        }
        else {
            logs = await roblox.getAuditLog(groupID, "ChangeRank", null, "Desc", 100, "");
        }
        if (logs.data.length === 0) {
            let embed = client.embedMaker({ title: "Nenhum logs encontrado", description: "Nenhum registro de auditoria foi encontrado com as configurações fornecidas", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        while (logs.data.length < limit) {
            let tempLogs;
            if (userID) {
                tempLogs = await roblox.getAuditLog(groupID, "ChangeRank", userID, "Desc", 100, logs.nextPageCursor);
            }
            else {
                tempLogs = await roblox.getAuditLog(groupID, "ChangeRank", null, "Desc", 100, logs.nextPageCursor);
            }
            logs.data = logs.data.concat(tempLogs.data);
            logs.previousPageCursor = tempLogs.previousPageCursor;
            logs.nextPageCursor = tempLogs.nextPageCursor;
        }
        if (logs.data.length > limit)
            logs.data = logs.data.slice(0, limit);
        if (date) {
            logs.data = logs.data.filter(log => {
                let formattedDate = format(log.created.toISOString()); // 0 = year, 1 = month, 2 = day
                if (parseInt(formattedDate[0]) === parseInt(date[2])) {
                    if (parseInt(formattedDate[1]) === parseInt(date[0])) {
                        return (parseInt(formattedDate[2]) >= parseInt(date[1]));
                    }
                    else {
                        return (parseInt(formattedDate[1]) >= parseInt(date[0]));
                    }
                }
                else {
                    return (parseInt(formattedDate[0]) > parseInt(date[2]));
                }
            });
        }
        if (logs.data.length === 0) {
            let embed = client.embedMaker({ title: "Não é possível reverter", description: "Com base nas configurações fornecidas, nenhuma reversão de rank é possível", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Processo de reversão, iniciando ...", description: "Agora estou iniciando o progresso da reversão com as configurações fornecidas. Por favor, seja paciente, pois isso pode levar algum tempo. Esta mensagem será editada assim que o processo estiver concluído", type: "info", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
        if (userID) {
            await client.logAction(`<@${interaction.user.id}> iniciou uma reversão de rank em **${GroupHandler_1.default.getNameFromID(groupID)}**. Os parâmetros que eles escolheram são os seguintes\n\n**Número de usuários**: ${logs.data.length}\n**Autor para reverter**: ${await roblox.getUsernameFromId(userID)}\n**Data de início**: ${(logDate ? logDate : "Nenhum filtro de data fornecido")}`);
        }
        else {
            await client.logAction(`<@${interaction.user.id}> iniciou uma reversão de rank em **${GroupHandler_1.default.getNameFromID(groupID)}**. Os parâmetros que eles escolheram são os seguintes\n\n**Número de usuários**: ${logs.data.length}\n**Autor para reverter**: Nenhum filtro de usuário fornecido\n**Data de início**: ${(logDate ? logDate : "Nenhum filtro de data fornecido")}`);
        }
        let roles = await roblox.getRoles(groupID);
        let failedAmount = 0;
        for (let i = 0; i < logs.data.length; i++) {
            let des = logs.data[i].description;
            let oldRankName;
            try {
                oldRankName = await roblox.getRankNameInGroup(groupID, des.TargetId);
            }
            catch {
                oldRankName = "Falha ao obter o nome do rank";
            }
            let didSuc = true;
            try {
                await roblox.setRank(groupID, des.TargetId, des.OldRoleSetId);
            }
            catch (e) {
                console.error(`Houve um erro ao tentar reverter o rank de ${des.TargetName}: ${e}`);
                await logAction(`${i + 1}: ${des.TargetName} (${des.TargetId}) não conseguiu reverter seu rank ${oldRankName} para ${getRankNameFromID(roles, des.OldRoleSetId)} por causa do seguinte erro: ${e}`);
                failedAmount++;
                didSuc = false;
            }
            if (didSuc) {
                await logAction(`${i + 1}: ${des.TargetName} (${des.TargetId}) foi capaz de reverter seu rank de ${oldRankName} para ${getRankNameFromID(roles, des.OldRoleSetId)}`);
            }
        }
        let sucRate = Math.round(((logs.data.length - failedAmount) / logs.data.length) * 100);
        let newEmbed = client.embedMaker({ title: "Reversão completa", description: `Eu terminei o processo de reversão dos rankings. Os logs foram anexados abaixo\n\nPorcentagem de sucesso: ${sucRate}% (${logs.data.length - failedAmount}/${logs.data.length})\nPorcentagem de falha: ${100 - sucRate}% (${failedAmount}/${logs.data.length})`, type: "info", author: interaction.user });
        await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [newEmbed] });
        await interaction.channel.send({ files: [`${process.cwd()}/${fileName}`] });
        await fs_1.default.promises.unlink(`${process.cwd()}/${fileName}`);
        return logs.data.length; // This is the only command where the multiplier is calculated, so I return it to multiply it in the main file
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("revert-ranks")
        .setDescription("Ações revertidas de rankings com base em determinadas configurações")
        .addStringOption(o => o.setName("group").setDescription("O grupo para fazer a reversão de ranking").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("limit").setDescription("A quantidade de ações a serem revertidas").setRequired(true))
        .addStringOption(o => o.setName("user").setDescription("O nome de usuário do usuário cujas ações você deseja reverter").setRequired(false))
        .addStringOption(o => o.setName("date").setDescription("A data em que você deseja iniciar (formatado mm/dd/aaaa)").setRequired(false)),
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.ranking,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Ranking"
    }
};
exports.default = command;
