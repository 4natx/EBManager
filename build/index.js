"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registeredCommands = exports.commands = void 0;
exports.registerSlashCommands = registerSlashCommands;
exports.loginToRoblox = loginToRoblox;
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const express = require("express");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("./config"));
const BotClient_1 = __importDefault(require("./utils/classes/BotClient"));
const CommandHelpers_1 = __importDefault(require("./utils/classes/CommandHelpers"));
const GroupHandler_1 = __importDefault(require("./utils/classes/GroupHandler"));
const UniverseHandler_1 = __importDefault(require("./utils/classes/UniverseHandler"));
const BetterConsole_1 = __importDefault(require("./utils/classes/BetterConsole"));
const VerificationHelpers_1 = __importDefault(require("./utils/classes/VerificationHelpers"));
const checkBans_1 = __importDefault(require("./utils/events/checkBans"));
const checkAuditLog_1 = __importDefault(require("./utils/events/checkAuditLog"));
const checkSuspensions_1 = __importDefault(require("./utils/events/checkSuspensions"));
const checkCooldowns_1 = __importDefault(require("./utils/events/checkCooldowns"));
const checkAbuse_1 = __importDefault(require("./utils/events/checkAbuse"));
const checkSales_1 = __importDefault(require("./utils/events/checkSales"));
const checkLoginStatus_1 = __importDefault(require("./utils/events/checkLoginStatus"));
const checkMemberCount_1 = __importDefault(require("./utils/events/checkMemberCount"));
const checkJobIDs_1 = __importDefault(require("./utils/events/checkJobIDs"));
const checkUpdates_1 = __importDefault(require("./utils/events/checkUpdates"));
const client = new BotClient_1.default(config_1.default);
exports.commands = [];
exports.registeredCommands = [];
async function readCommands(path) {
    if (!path)
        path = "./commands";
    let files = await fs_1.default.promises.readdir(path);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (!file.includes(".")) {
            await readCommands(`${path}/${file}`);
        }
        else {
            file = file.replace(".ts", ".js"); // This is here because when it compiles to JS, it saves to the build directory, and it starts as build/index.js, so it's reading files in build/commands, hence the string change
            let commandFile = require(`${path}/${file}`).default; // .default cause when you call "export default <x>" it adds a default property to it (idk why)
            try {
                let command = {
                    file: commandFile,
                    name: file.split(".")[0],
                    slashData: commandFile.slashData,
                    commandData: commandFile.commandData,
                };
                exports.commands.push(command);
            }
            catch (e) {
                console.error(`Couldn't load the command data for the ${file.split(".")[0]} command with error: ${e}`);
            }
        }
    }
}
async function registerSlashCommands(reload) {
    if (reload) {
        exports.commands.length = 0;
        await readCommands();
    }
    let slashCommands = [];
    if (config_1.default.groupIds.length === 0)
        config_1.default.lockedCommands = config_1.default.lockedCommands.concat(CommandHelpers_1.default.getGroupCommands());
    if (config_1.default.universes.length === 0)
        config_1.default.lockedCommands = config_1.default.lockedCommands.concat(CommandHelpers_1.default.getGameCommands());
    if (!config_1.default.xpSystem.enabled)
        config_1.default.lockedCommands = config_1.default.lockedCommands.concat(CommandHelpers_1.default.getXPCommands());
    if (!config_1.default.counting.enabled)
        config_1.default.lockedCommands.push("setgoal");
    for (let i = 0; i < exports.commands.length; i++) {
        let lockedCommandsIndex = config_1.default.lockedCommands.findIndex((c) => c.toLowerCase() === exports.commands[i].name);
        let allowedCommandsIndex = CommandHelpers_1.default.allowedCommands.findIndex((c) => c.toLowerCase() === exports.commands[i].name);
        if (lockedCommandsIndex !== -1 && allowedCommandsIndex === -1) {
            BetterConsole_1.default.log(`Skipped registering the ${exports.commands[i].name} command because it's locked and not part of the default allowed commands list`);
            continue;
        }
        exports.registeredCommands.push(exports.commands[i]);
        let commandData;
        try {
            commandData = exports.commands[i].slashData.toJSON();
            slashCommands.push(commandData);
        }
        catch (e) {
            console.error(`Couldn't load the slash command data for the ${exports.commands[i].name} command with error: ${e}`);
        }
    }
    let rest = new discord_js_1.default.REST().setToken(config_1.default.DISCORD_TOKEN);
    try {
        await rest.put(discord_js_1.default.Routes.applicationCommands(client.user.id), {
            body: slashCommands,
        });
    }
    catch (e) {
        console.error(`There was an error while registering slash commands: ${e}`);
    }
}
async function deleteGuildCommands() {
    let rest = new discord_js_1.default.REST().setToken(config_1.default.DISCORD_TOKEN);
    let guilds = await client.guilds.fetch({ limit: 200 });
    for (let i = 0; i < guilds.size; i++) {
        let guild = guilds.at(i);
        try {
            await rest.put(discord_js_1.default.Routes.applicationGuildCommands(client.user.id, guild.id), { body: [] });
        }
        catch (e) {
            console.error(`There was an error while trying to delete guild commmands: ${e}`);
        }
    }
}
async function loginToRoblox(robloxCookie) {
    try {
        client.robloxInfo = await roblox.setCookie(robloxCookie);
    }
    catch {
        console.error("Unable to login to Roblox");
        client.setStatusActivity();
        client.isLoggedIn = false;
        return;
    }
    BetterConsole_1.default.log(`Logged into the Roblox account - ${client.robloxInfo.UserName}`, true);
    client.isLoggedIn = true;
    for (let i = 0; i < config_1.default.groupIds.length; i++) {
        let groupID = config_1.default.groupIds[i];
        await (0, checkAuditLog_1.default)(groupID, client);
        await (0, checkAbuse_1.default)(groupID, client);
        await (0, checkSales_1.default)(groupID, client);
        await (0, checkMemberCount_1.default)(groupID, client);
    }
    await (0, checkBans_1.default)(client);
    await (0, checkSuspensions_1.default)(client);
    await (0, checkLoginStatus_1.default)(client);
}
client.once("ready", async () => {
    BetterConsole_1.default.log(`Logged into the Discord account - ${client.user.tag}`, true);
    if (client.application.botPublic) {
        console.warn("BOT IS PUBLIC | SHUTTING DOWN");
        return process.exit();
    }
    (0, checkCooldowns_1.default)(client);
    await (0, checkUpdates_1.default)(client);
    await roblox.setAPIKey(config_1.default.ROBLOX_API_KEY);
    if (config_1.default.groupIds.length !== 0) {
        await loginToRoblox(config_1.default.ROBLOX_COOKIE);
        await GroupHandler_1.default.loadGroups();
    }
    if (config_1.default.universes.length !== 0) {
        await UniverseHandler_1.default.loadUniverses();
        await (0, checkJobIDs_1.default)(client);
    }
    await readCommands();
    await deleteGuildCommands();
    await registerSlashCommands();
});
let app = express();
let port = process.env.PORT || 8080;
app.get("/", (req, res) => res.status(200).send("Server is online!")); // Basic homepage
app.listen(port, () => console.log(`Listening on port ${port}`));
client.on("interactionCreate", async (interaction) => {
    if (interaction.type !== discord_js_1.default.InteractionType.ApplicationCommand)
        return;
    let command = interaction.commandName.toLowerCase();
    for (let i = 0; i < exports.commands.length; i++) {
        if (exports.commands[i].name === command) {
            try {
                await interaction.deferReply({
                    ephemeral: exports.commands[i].commandData.isEphemeral,
                });
            }
            catch (e) {
                console.error(e);
                return; // This error only happens with the plugin command. Idk why
            }
            let args = CommandHelpers_1.default.loadArguments(interaction);
            if (args["username"]) {
                let usernames = args["username"]
                    .replaceAll(" ", "")
                    .split(",");
                if (usernames.length > config_1.default.maximumNumberOfUsers) {
                    let embed = client.embedMaker({
                        title: "Número máximo de usuários excedidos",
                        description: "Você inseriu mais usuários do que o máximo permitido no momento, abaixe a quantidade de usuários em seu comando e tente novamente",
                        type: "error",
                        author: interaction.user,
                    });
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            }
            if (!CommandHelpers_1.default.checkPermissions(exports.commands[i].file, interaction.member)) {
                let embed = client.embedMaker({
                    title: "Sem permissão",
                    description: "Você não tem permissão para executar este comando",
                    type: "error",
                    author: interaction.user,
                });
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            if (exports.commands[i].file.commandData.hasCooldown) {
                if (client.isUserOnCooldown(exports.commands[i].file.slashData.name, interaction.user.id)) {
                    let embed = client.embedMaker({
                        title: "Cooldown",
                        description: "Você está atualmente em cooldown para este comando, tome uma chocolate quente enquanto isso",
                        type: "error",
                        author: interaction.user,
                    });
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            }
            if (exports.commands[i].file.commandData.preformGeneralVerificationChecks) {
                let groupID = GroupHandler_1.default.getIDFromName(args["group"]);
                let robloxID = await VerificationHelpers_1.default.getRobloxUser(interaction.guild.id, interaction.user.id);
                let verificationStatus;
                if (robloxID !== 0) {
                    verificationStatus =
                        await VerificationHelpers_1.default.preformVerificationChecks(groupID, robloxID, exports.commands[i].commandData.permissionToCheck);
                }
                else {
                    verificationStatus = {
                        success: false,
                        err: `User is not verified with the configured verification provider (${config_1.default.verificationProvider})`,
                    };
                }
                if (!verificationStatus.success) {
                    let embed = client.embedMaker({
                        title: "As verificações falharam",
                        description: `Você falhou nas verificações, motivo: ${verificationStatus.err}`,
                        type: "error",
                        author: interaction.user,
                    });
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            }
            let res;
            try {
                res = await exports.commands[i].file.run(interaction, client, args);
            }
            catch (e) {
                let embed = client.embedMaker({
                    title: "Error",
                    description: "Houve um erro ao tentar executar esse comando. O erro foi registrado no console",
                    type: "error",
                    author: interaction.user,
                });
                await interaction.editReply({ embeds: [embed] });
                console.error(e);
            }
            if (exports.commands[i] && exports.commands[i].file.commandData.hasCooldown) {
                let commandCooldown = client.getCooldownForCommand(exports.commands[i].file.slashData.name);
                if (typeof res === "number") {
                    // If we return a number, it means the cooldown multipler got calculated
                    client.commandCooldowns.push({
                        commandName: exports.commands[i].file.slashData.name,
                        userID: interaction.user.id,
                        cooldownExpires: Date.now() + commandCooldown * res,
                    });
                }
                else if (args["username"]) {
                    let usernames = args["username"]
                        .replaceAll(" ", "")
                        .split(",");
                    client.commandCooldowns.push({
                        commandName: exports.commands[i].file.slashData.name,
                        userID: interaction.user.id,
                        cooldownExpires: Date.now() + commandCooldown * usernames.length,
                    });
                }
                else {
                    client.commandCooldowns.push({
                        commandName: exports.commands[i].file.slashData.name,
                        userID: interaction.user.id,
                        cooldownExpires: Date.now() + commandCooldown,
                    });
                }
            }
        }
    }
});
client.on("interactionCreate", async (interaction) => {
    if (interaction.type !==
        discord_js_1.default.InteractionType.ApplicationCommandAutocomplete)
        return;
    let command = interaction.commandName.toLowerCase();
    for (let i = 0; i < exports.commands.length; i++) {
        if (exports.commands[i].name === command) {
            try {
                await exports.commands[i].file.autocomplete(interaction, client);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
});
client.on("messageCreate", async (message) => {
    if (!config_1.default.xpSystem.enabled)
        return;
    if (message.author.bot)
        return;
    let xpData = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8"));
    let index = xpData.findIndex((v) => v.discordID === message.author.id);
    let userData;
    if (index !== -1) {
        userData = xpData[index];
    }
    else {
        userData = {
            discordID: message.author.id,
            robloxID: 0,
            redeemedRewards: [],
            xp: 0,
        };
    }
    userData.xp += config_1.default.xpSystem.earnings.messages;
    if (index !== -1) {
        xpData[index] = userData;
    }
    else {
        xpData.push(userData);
    }
    await fs_1.default.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
});
client.on("messageReactionAdd", async (reaction, user) => {
    if (!config_1.default.xpSystem.enabled)
        return;
    if (user.bot)
        return;
    let xpData = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8"));
    let index = xpData.findIndex((v) => v.discordID === user.id);
    let userData;
    if (index !== -1) {
        userData = xpData[index];
    }
    else {
        userData = {
            discordID: user.id,
            robloxID: 0,
            redeemedRewards: [],
            xp: 0,
        };
    }
    userData.xp += config_1.default.xpSystem.earnings.reactions;
    if (index !== -1) {
        xpData[index] = userData;
    }
    else {
        xpData.push(userData);
    }
    await fs_1.default.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
});
let oldMethod = console.error;
console.error = function (msg) {
    if (!msg.toString().includes("ExperimentalWarning"))
        oldMethod(msg);
};
client.login(config_1.default.DISCORD_TOKEN);
