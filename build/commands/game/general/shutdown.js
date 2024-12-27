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
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        try {
            await MessagingService_1.default.sendMessage(universeID, "Shutdown", {
                isGlobal: (typeOfOperation === "global"),
                jobID: jobID,
                reason: reason
            });
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to send the shutdown request: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        if (typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has shutdown all of the servers of **${universeName}** for the reason of **${reason}**`);
        }
        else {
            await client.logAction(`<@${interaction.user.id}> has shutdown the server of **${universeName}** with the job ID of **${jobID}** for the reason of **${reason}**`);
        }
        let embed = client.embedMaker({ title: "Success", description: "You've successfully sent out the following shutdown to be executed based on the inputted settings", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("shutdown")
        .setDescription("Shutdowns all servers or shuts down a specific server")
        .addSubcommand(sc => {
        sc.setName("global");
        sc.setDescription("Shuts down all of the running servers");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("jobid");
        sc.setDescription("Shuts down one specific server");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true));
        sc.addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to shutdown (only if you choose so)").setRequired(true));
        return sc;
    }),
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.shutdown,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
