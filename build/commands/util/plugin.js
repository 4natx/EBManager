"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const __1 = require("../..");
const BetterConsole_1 = __importDefault(require("../../utils/classes/BetterConsole"));
const exe = require('util').promisify(require('child_process').exec);
const pluginAPIURL = "https://api.github.com/repos/sv-du/rbx-manager-plugins/contents/";
const map = {
    "Ban": `game/ban`,
    "Database": `game/database`,
    "General Game": `game/general`,
    "JobID": `game/general`,
    "Lock": `game/lock`,
    "Mute": `game/mute`,
    "General Group": `group/general`,
    "Join Request": `group/join-requests`,
    "Ranking": `group/ranking`,
    "User": `group/user`,
    "Shout": `group/shout`,
    "XP": `group/xp`,
    "Util": `util`,
};
async function fetchPlugins() {
    let res = await (await fetch(pluginAPIURL)).json();
    let plugins = [];
    for (let i = 0; i < res.length; i++) {
        if (res[i].name.includes(".ts")) {
            let source = await (await fetch(`${res[i].download_url}`)).text();
            let index = source.indexOf("category: ") + 11;
            source = source.substring(index);
            index = source.indexOf('"');
            source = source.substring(0, index);
            let normalDirectory = `${process.cwd()}/commands/${map[source]}`;
            let buildDirectory = `${process.cwd()}/build/commands/${map[source]}`;
            plugins.push({
                name: res[i].name.split(".")[0],
                downloadURL: res[i].download_url,
                normalInstallationPath: normalDirectory,
                buildInstallationPath: buildDirectory
            });
        }
    }
    return plugins;
}
const command = {
    run: async (interaction, client, args) => {
        let mode = args["subcommand"];
        let name = args["name"];
        let plugins = await fetchPlugins();
        if (mode === "list") {
            let installedPluginString = "";
            for (let i = 0; i < plugins.length; i++) {
                if (fs_1.default.existsSync(`${plugins[i].normalInstallationPath}/${plugins[i].name}.ts`)) {
                    let file = require(`${plugins[i].buildInstallationPath}/${plugins[i].name}.js`).default;
                    installedPluginString += `**${file.slashData.name}** - ${file.slashData.description}\n`;
                }
            }
            if (installedPluginString === "") {
                let embed = client.embedMaker({ title: "No Plugins Installed", description: "You don't have any plugins installed", type: "info", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            else {
                let embed = client.embedMaker({ title: "Plugins Installed", description: `You have the following plugins installed:\n\n${installedPluginString}`, type: "info", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        if (mode === "install") {
            let pluginEntry = plugins.find(v => v.name.toLowerCase() === name.toLowerCase());
            if (!pluginEntry) {
                let embed = client.embedMaker({ title: "Invalid Plugin Name", description: "You inputted an invalid plugin name, please find valid ones [here](https://github.com/sv-du/rbx-manager-plugins)", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            let source = await (await fetch(`${pluginEntry.downloadURL}`)).text();
            await fs_1.default.promises.writeFile(`${pluginEntry.normalInstallationPath}/${pluginEntry.name}.ts`, source);
        }
        if (mode === "uninstall") {
            let pluginEntry = plugins.find(v => v.name.toLowerCase() === name.toLowerCase());
            if (!pluginEntry) {
                let embed = client.embedMaker({ title: "Invalid Plugin Name", description: "You inputted an invalid plugin name, please find valid ones [here](https://github.com/sv-du/rbx-manager-plugins)", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            try {
                await fs_1.default.promises.unlink(`${pluginEntry.normalInstallationPath}/${pluginEntry.name}.ts`);
            }
            catch {
                let embed = client.embedMaker({ title: "Not Installed", description: "The supplied plugin is not installed", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        BetterConsole_1.default.log("Building...");
        if (process.platform === "win32") {
            await exe("npm run winBuild");
        }
        else {
            await exe("npm run linuxBuild");
        }
        BetterConsole_1.default.log("Registering...");
        try {
            await (0, __1.registerSlashCommands)(true);
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while updating the command list: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let embed = client.embedMaker({ title: "Operation Successful", description: "The operation has successfully completed", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("plugin")
        .setDescription("Manages installed plugins")
        .addSubcommand(sc => {
        sc.setName("install");
        sc.setDescription("Installs a plugin");
        sc.addStringOption(o => o.setName("name").setDescription("The name of the plugin to install").setRequired(true));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("list");
        sc.setDescription("Lists installed plugins");
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("uninstall");
        sc.setDescription("Uninstalls a plugin");
        sc.addStringOption(o => o.setName("name").setDescription("The name of the plugin to uninstall").setRequired(true));
        return sc;
    }),
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
