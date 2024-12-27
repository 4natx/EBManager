"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../../../config"));
const CommandHelpers_1 = __importDefault(require("../../../utils/classes/CommandHelpers"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const VerificationHelpers_1 = __importDefault(require("../../../utils/classes/VerificationHelpers"));
function parseRanks(ranks) {
    let parsed = ranks.split(",");
    for (let i = 0; i < parsed.length; i++) {
        parsed[i] = parsed[i].trim();
    }
    return parsed;
}
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers_1.default.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let ranks = parseRanks(args["rank"]);
        if (ranks.length === 1) {
            while (true) {
                if (ranks.length === usernames.length)
                    break;
                ranks.push(ranks[0]);
            }
        }
        else if (ranks.length !== usernames.length) {
            let embed = client.embedMaker({ title: "Erro de argumento", description: "Você inseriu uma quantidade desigual de nomes de usuário e ranks, verifique se esses valores são iguais ou, se desejar aplicar ranks a várias pessoas, apenas coloque o rank para o argumento do rank", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let reasonData = CommandHelpers_1.default.parseReasons(usernames, args["reason"]);
        if (reasonData.didError) {
            let embed = client.embedMaker({ title: "Erro de argumento", description: `Você inseriu uma quantidade desigual de nomes de usuário e razões, verifique se esses valores são iguais ou, se desejar aplicar um motivo a várias pessoas, apenas coloque esse motivo para o argumento do motivo`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let reasons = reasonData.parsedReasons;
        for (let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let rank = ranks[i];
            let victimRobloxID = await roblox.getIdFromUsername(username);
            if (!victimRobloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O nome de usuário fornecido é um nome de usuário Roblox inválido"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if (config_1.default.verificationChecks) {
                let verificationStatus = await VerificationHelpers_1.default.preformVerificationChecks(groupID, authorRobloxID, "Ranking", victimRobloxID);
                if (!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `As verificações falharam, motivo: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let suspensions = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8"));
            let index = suspensions.findIndex(v => v.userId === victimRobloxID);
            if (index != -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "Este usuário está atualmente suspenso"
                });
                continue;
            }
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if (rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário fornecido não está no grupo"
                });
                continue;
            }
            let roles = await roblox.getRoles(groupID);
            let isRankID = Number(rank) == rank;
            try {
                if (!isRankID) { // If a rank name was inputed
                    rank = roles.find(v => v.name.toLowerCase() === rank.toLowerCase()).rank; // Errors if not a group role
                }
                else {
                    rank = Number(rank);
                    let index = roles.findIndex(v => v.rank === rank);
                    if (index === -1)
                        throw ("");
                }
            }
            catch {
                logs.push({
                    username: username,
                    status: "Error",
                    message: `O rank fornecido, **${rank}**, é inválido`
                });
                continue;
            }
            if (config_1.default.verificationChecks) {
                let authorRank = await roblox.getRankInGroup(groupID, authorRobloxID);
                if (rank >= authorRank) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Checagem de Verificações falharam"
                    });
                    continue;
                }
            }
            let roleObject = await roblox.getRole(groupID, rank);
            if (client.isLockedRole(roleObject)) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: `O rank fornecido, **${rank}**, está atualmente bloqueado`
                });
                continue;
            }
            let oldRank = await roblox.getRankNameInGroup(groupID, victimRobloxID);
            try {
                await roblox.setRank(groupID, victimRobloxID, rank);
            }
            catch (e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            let newRank = await roblox.getRankNameInGroup(groupID, victimRobloxID);
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> alterou o rank do **${username}** de **${oldRank}** para **${newRank}** pelo motivo de **${reason}** em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("setrank")
        .setDescription("Define o rank do (s) usuário (s) de entrada (s) para o (s) rank (s) inseridos (s)")
        .addStringOption(o => o.setName("group").setDescription("O grupo para alterar o rank").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário da pessoa/pessoas que você deseja alterar").setRequired(true))
        .addStringOption(o => o.setName("rank").setDescription("O (s) rank (s) que você deseja que a pessoa/pessoas tenha").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) do (s) ranking (s)").setRequired(false)),
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
