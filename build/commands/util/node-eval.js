"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
function formatLoggedData(data) {
    let formatted = "";
    for (let i = 0; i < data.length; i++) {
        formatted += `${data[i]}\n`;
    }
    return formatted;
}
const command = {
    run: async (interaction, client, args) => {
        let code = args["code"];
        let loggedData = [];
        let oldMethod = console.log;
        console.log = function (msg) {
            if (!msg)
                msg = "";
            loggedData.push(msg.toString());
            oldMethod(msg);
        };
        if (code.startsWith("https://")) {
            code = await (await fetch(code, { method: "GET" })).text();
        }
        try {
            let res = await eval(code);
            let embed = client.embedMaker({ title: "Success", description: "The supplied code has ran successfully", type: "success", author: interaction.user });
            if (res) {
                embed.addFields({
                    name: "Returned Data",
                    value: res.toString()
                });
            }
            if (loggedData.length !== 0) {
                embed.addFields({
                    name: "Logged Data",
                    value: "```\n" + formatLoggedData(loggedData) + "```"
                });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: "There was an error while trying to run this code", type: "error", author: interaction.user });
            embed.addFields({
                name: "Error",
                value: "```\n" + e.toString() + "```"
            });
            await interaction.editReply({ embeds: [embed] });
        }
        console.log = oldMethod;
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("node-eval")
        .setDescription("Runs Javascript code in the bot environment")
        .addStringOption(o => o.setName("code").setDescription("The code to run (can also be a URL to the code to run)").setRequired(true)),
    commandData: {
        category: "Util",
        isEphemeral: true,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
