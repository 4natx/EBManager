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
const command = {
    run: async (interaction, client, args) => {
        let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
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
            let robloxID = await roblox.getIdFromUsername(username);
            if (!robloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O nome de usuário fornecido é um nome de usuário Roblox inválido"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(robloxID);
            try {
                await roblox.handleJoinRequest(groupID, robloxID, false);
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
            await client.logAction(`<@${interaction.user.id}> negou a solicitação de **${username}** pelo motivo de **${reason}** em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("deny-join-request")
        .setDescription("Nega a solicitação de junção do (s) usuário (s) inserido")
        .addStringOption(o => o.setName("group").setDescription("O grupo a negar a solicitação").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja negar a solicitação").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) de por que você está negando as solicitações").setRequired(false)),
    commandData: {
        category: "Join Request",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.joinrequests,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "JoinRequests"
    }
};
exports.default = command;
