"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const roblox = require("noblox.js");
const config_1 = __importDefault(require("../../../config"));
const UniverseHandler_1 = __importDefault(require("../../../utils/classes/UniverseHandler"));
const command = {
    run: async (interaction, client, args) => {
        let name = args["name"];
        let key = args["key"];
        let scope = args["scope"] || "global";
        let universeName = args["universe"];
        let universeID = UniverseHandler_1.default.getIDFromName(universeName);
        try {
            await roblox.deleteDatastoreEntry(universeID, name, key, scope);
        }
        catch (e) {
            let embed;
            let err = e.toString();
            if (err.includes("NOT_FOUND")) {
                embed = client.embedMaker({ title: "Error", description: "The supplied data doesn't return any data, please try a different combination", type: "error", author: interaction.user });
            }
            else {
                embed = client.embedMaker({ title: "Error", description: `There was an error while trying to delete data: ${e}`, type: "error", author: interaction.user });
            }
            return interaction.editReply({ embeds: [embed] });
        }
        await client.logAction(`<@${interaction.user.id}> has deleted the **${key}** key in the **${name}** datastore, which is located in the **${scope}** scope from **${universeName}**`);
        let embed = client.embedMaker({ title: "Success", description: "You've successfully deleted this data", type: "success", author: interaction.user });
        await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("deletevalue")
        .setDescription("Deletes data from the datastores with the given settings")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("name").setDescription("The name of the datastore to delete data from").setRequired(true))
        .addStringOption(o => o.setName("key").setDescription("The entry key of the data to delete from the datastore").setRequired(true))
        .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false)),
    commandData: {
        category: "Database",
        isEphemeral: false,
        permissions: config_1.default.permissions.game.datastore,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
