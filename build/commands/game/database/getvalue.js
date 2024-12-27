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
        let returnedData;
        try {
            returnedData = await (await roblox.getDatastoreEntry(universeID, name, key, scope));
        }
        catch (e) {
            let embed;
            let err = e.toString();
            if (err.includes("NOT_FOUND")) {
                embed = client.embedMaker({ title: "Error", description: "The supplied data doesn't return any data, please try a different combination", type: "error", author: interaction.user });
            }
            else {
                embed = client.embedMaker({ title: "Error", description: `There was an error while trying to fetch data: ${e}`, type: "error", author: interaction.user });
            }
            return await interaction.editReply({ embeds: [embed] });
        }
        if (typeof (returnedData.data) === "object")
            returnedData.data = JSON.stringify(returnedData.data, null, "\t");
        let topData = `Datastore Name: ${name}\nScope: ${scope}\nEntry Key: ${key}`;
        let description = "**Provided Data**\n```{topData}```\n**Returned Data**\n```json\n{returnedData}```\n**Metadata**\n```json\n{metadata}```";
        description = description.replace("{topData}", topData);
        description = description.replace("{returnedData}", returnedData.data);
        description = description.replace("{metadata}", JSON.stringify(returnedData.metadata, null, "\t"));
        let embed = client.embedMaker({ title: "Success", description: description, type: "success", author: interaction.user });
        return await interaction.editReply({ embeds: [embed] });
    },
    slashData: new discord_js_1.default.SlashCommandBuilder()
        .setName("getvalue")
        .setDescription("Gets the datastore value with the inputted settings")
        .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler_1.default.parseUniverses()))
        .addStringOption(o => o.setName("name").setDescription("The name of the datastore to fetch data from").setRequired(true))
        .addStringOption(o => o.setName("key").setDescription("The entry key of the data to fetch from the datastore").setRequired(true))
        .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false)),
    commandData: {
        category: "Database",
        isEphemeral: true,
        permissions: config_1.default.permissions.game.datastore,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
};
exports.default = command;
