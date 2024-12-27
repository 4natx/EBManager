"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const config_1 = __importDefault(require("../../../config"));
const MessagingService_1 = __importDefault(require("../../../utils/classes/MessagingService"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let typeOfOperation = args["subcommand"];
        let code = args["code"];
        let jobID = args["jobid"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        if (code.startsWith("https://")) {
            code = await (await fetch(code, { method: "GET" })).text();
        }
        try {
            await MessagingService_1.default.sendMessage(universeID, "Eval", {
                isGlobal: (typeOfOperation === "global"),
                code: code,
                jobID: jobID
            });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to send this code for execution: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        if (typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has executed **${code}** in all of the servers of **${universeName}**`);
        }
        else {
            await client.logAction(`<@${interaction.user.id}> has executed **${code}** the server of **${universeName}** with the job ID of **${jobID}**`);
        }
        let embed = client.embedMaker({ title: "Success", description: "You've successfully sent out the following code to be executed based on the inputted settings", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("game-eval")
        .setDescription("Runs serverside code")
        .addSubcommand(sc => {
        sc.setName("global");
        sc.setDescription("Runs serverside code on all running servers");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("code").setDescription("The code to execute in the game (can also be a URL to the code to run)").setRequired(true));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("jobid");
        sc.setDescription("Runs serverside code in one specific server");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("code").setDescription("The code to execute in the game (can also be a URL to the code to run)").setRequired(true));
        sc.addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to run the code in (only if you choose so)").setRequired(true));
        return sc;
    }),
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.execution,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
