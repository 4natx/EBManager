"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const CommandHelpers_1 = __importDefault(require("../../../utils/classes/CommandHelpers"));
const GroupHandler_1 = __importDefault(require("../../../utils/classes/GroupHandler"));
const VerificationHelpers_1 = __importDefault(require("../../../utils/classes/VerificationHelpers"));
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers_1.default.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers_1.default.parseReasons(usernames, args["reason"]);
        if (reasonData.didError) {
            let embed = client.embedMaker({ title: "Erro de argumento", description: `Você inseriu uma quantidade desigual de nomes de usuário e razões, verifique se esses valores são iguais ou, se desejar aplicar um motivo a várias pessoas, apenas coloque esse motivo para o argumento do motivo`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let reasons = reasonData.parsedReasons;
        for (let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
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
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if (rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário fornecido não está no grupo"
                });
                continue;
            }
            let ranks = await roblox.getRoles(groupID);
            let lowestRank = Number.MAX_VALUE;
            for (let i = 0; i < ranks.length; i++) {
                let rankID = ranks[i].rank;
                if (lowestRank > rankID && rankID != 0) {
                    lowestRank = rankID;
                }
            }
            try {
                await roblox.setRank(groupID, victimRobloxID, lowestRank);
            }
            catch (e) {
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
            await client.logAction(`<@${interaction.user.id}> demitiu **${username}** pelo motivo **${reason}** em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("fire")
        .setDescription("Demite o (s) usuário (s) inserido (s)")
        .addStringOption(o => o.setName("group").setDescription("O grupo para fazer a demissão").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja demitir").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) da demissão").setRequired(false)),
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
