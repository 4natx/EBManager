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
                let verificationStatus = await VerificationHelpers_1.default.preformVerificationChecks(groupID, authorRobloxID, "Exile", victimRobloxID);
                if (!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `As verificações falharam, motivo: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let bannedUsers = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8"));
            let index = bannedUsers.findIndex(v => v.groupID === groupID && v.userID === victimRobloxID);
            if (index === -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário fornecido não é banido do grupo"
                });
                continue;
            }
            bannedUsers.splice(index, 1);
            await fs_1.default.promises.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(bannedUsers));
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> desbaniu **${username}** do grupo pelo motivo de **${reason}** de **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("ungroupban")
        .setDescription("Desbane o (s) usuário (s) inserido do grupo")
        .addStringOption(o => o.setName("group").setDescription("O grupo para fazer o desban").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja desbanir do grupo").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) do (s) unban (s)").setRequired(false)),
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config_1.default.permissions.group.user,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Exile"
    }
};
exports.default = command;
