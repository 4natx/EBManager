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
                    message: "O usuário não está no grupo."
                });
                continue;
            }
            let roles = await roblox.getRoles(groupID);
            let currentRoleIndex = roles.findIndex(role => role.rank === rankID);
            let currentRole = roles[currentRoleIndex];
            let potentialRole = roles[currentRoleIndex - 1];
            if (potentialRole.rank === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "O usuário já está com o menor cargo no grupo."
                });
                continue;
            }
            let oldRoleName = currentRole.name;
            let lockedRank = false;
            if (client.isLockedRole(potentialRole)) {
                lockedRank = true;
                let shouldBreakAfterForLoop = false;
                for (let i = currentRoleIndex - 1; i >= 0; i--) {
                    potentialRole = roles[i];
                    if (potentialRole.rank === 0) {
                        logs.push({
                            username: username,
                            status: "Error",
                            message: "Todos os cargos abaixo do usuários estão bloqueados."
                        });
                        shouldBreakAfterForLoop = true;
                    }
                    if (!client.isLockedRole(potentialRole))
                        break;
                }
                if (shouldBreakAfterForLoop)
                    continue; // If I call continue in the nested for loop (the one right above this line), it won't cause the main username for loop to skip over the rest of the code
            }
            if (lockedRank) {
                let shouldContinue = false;
                let embed = client.embedMaker({ title: "Cargo bloqueado", description: `O (s) cargo (s) abaixo **${username}** está trancado, você gostaria de rebaixar **${username}** para **${potentialRole.name}**?`, type: "info", author: interaction.user });
                let componentData = client.createButtons([
                    { customID: "yesButton", label: "Sim", style: discord_js_1.default.ButtonStyle.Success },
                    { customID: "noButton", label: "Não", style: discord_js_1.default.ButtonStyle.Danger }
                ]);
                let msg = await interaction.editReply({ embeds: [embed], components: componentData.components });
                let filter = (buttonInteraction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
                let button = (await msg.awaitMessageComponent({ filter: filter, time: config_1.default.collectorTime }));
                if (button) {
                    if (button.customId === "yesButton") {
                        shouldContinue = true;
                        await button.reply({ content: "ㅤ" });
                        await button.deleteReply();
                    }
                }
                else {
                    let disabledComponents = client.disableButtons(componentData).components;
                    await msg.edit({ components: disabledComponents });
                }
                if (!shouldContinue) {
                    logs.push({
                        username: username,
                        status: "Cancelled",
                    });
                    continue;
                }
            }
            try {
                await roblox.setRank(groupID, victimRobloxID, potentialRole.rank);
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
            await client.logAction(`<@${interaction.user.id}> rebaixou **${username}** de **${oldRoleName}** para **${potentialRole.name}** pelo motivo de **${reason}** em **${GroupHandler_1.default.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("demote")
        .setDescription("Rebaixa o usuário em 1 cargo.")
        .addStringOption(o => o.setName("group").setDescription("O grupo para fazer o rebaixamento em").setRequired(true).addChoices(...GroupHandler_1.default.parseGroups()))
        .addStringOption(o => o.setName("username").setDescription("O (s) nome de usuário (s) do (s) usuário (s) que você deseja rebaixar").setRequired(true))
        .addStringOption(o => o.setName("reason").setDescription("O (s) motivo (s) do (s) rebaixamento (s)").setRequired(false)),
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
