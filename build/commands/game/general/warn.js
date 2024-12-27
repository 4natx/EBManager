"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const MessagingService_1 = __importDefault(require("../../../utils/classes/MessagingService"));
const RobloxDatastore_1 = __importDefault(require("../../../utils/classes/RobloxDatastore"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let mode = args["subcommand"];
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        let username = args["username"];
        let robloxID = await roblox.getIdFromUsername(username);
        if (!robloxID) {
            let embed = client.embedMaker({ title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        let res = await RobloxDatastore_1.default.getModerationData(universeID, robloxID);
        if (res.err) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to fetch the user's moderation data: ${res.err}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        if (!res.data.warns)
            res.data.warns = [];
        let reason = args["reason"];
        if (!reason)
            reason = "No reason provided";
        if (mode === "add") {
            res.data.warns.push({
                author: interaction.user.tag,
                reason: reason,
                dateAssigned: Date.now()
            });
            try {
                await MessagingService_1.default.sendMessage(universeID, "Warn", { username: username, reason: reason });
            }
            catch (e) {
                let embed = client.embedMaker({ title: "Error", description: `Error in trying to notify the user: ${e}`, type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
        }
        else {
            let index = res.data.warns.findIndex(w => w.reason.toLowerCase() === reason.toLowerCase());
            if (index === -1) {
                let embed = client.embedMaker({ title: "No Warning Found", description: "There wasn't a warning found with the given reason supplied", type: "error", author: interaction.user });
                return await interaction.editReply({ embeds: [embed] });
            }
            res.data.warns.splice(index, 1);
        }
        try {
            await RobloxDatastore_1.default.setModerationData(universeID, robloxID, res.data);
        }
        catch (e) {
            let embed = client.embedMaker({ title: "Error", description: `There was an error while trying to save the user's moderation data: ${e}`, type: "error", author: interaction.user });
            return await interaction.editReply({ embeds: [embed] });
        }
        if (mode === "add") {
            let embed = client.embedMaker({ title: "Success", description: "You've successfully warned this user and have notified them in game", type: "success", author: interaction.user });
            await interaction.editReply({ embeds: [embed] });
            await client.logAction(`<@${interaction.user.id}> has warned **${username}** in **${universeName}** for the reason of **${reason}**`);
        }
        else {
            let embed = client.embedMaker({ title: "Success", description: "You've successfully deleted this warning", type: "success", author: interaction.user });
            await interaction.editReply({ embeds: [embed] });
            await client.logAction(`<@${interaction.user.id}> has deleted a warning from **${username}** in **${universeName}** that had the reason of **${reason}**`);
        }
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("warn")
        .setDescription("Manages warnings")
        .addSubcommand(sc => {
        sc.setName("add");
        sc.setDescription("Adds a warning to a user");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("username").setDescription("The username of the user you wish to warn").setRequired(true));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the warn").setRequired(false));
        return sc;
    })
        .addSubcommand(sc => {
        sc.setName("delete");
        sc.setDescription("Deletes a warning from a user given its reason");
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()));
        sc.addStringOption(o => o.setName("username").setDescription("The username of the user you wish to delete the warning from").setRequired(true));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the warn").setRequired(true));
        return sc;
    }),
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.general,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
