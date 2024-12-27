"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkSales;
const GroupHandler_1 = __importDefault(require("../classes/GroupHandler"));
const config_1 = __importDefault(require("../../config"));
const oldDates = [];
async function getSales(client, groupID) {
    let res = await fetch(`https://economy.roblox.com/v2/groups/${groupID}/transactions?cursor=&limit=100&transactionType=Sale`, {
        headers: {
            "Cookie": `.ROBLOSECURITY=${config_1.default.ROBLOX_COOKIE}`
        }
    });
    let json = await res.json();
    if (json.data) {
        let sales = json.data;
        for (let i = 0; i < sales.length; i++) {
            sales[i].created = new Date(sales[i].created);
        }
        return sales;
    }
}
async function checkSales(groupID, client) {
    if (!client.isLoggedIn)
        return;
    if (config_1.default.logging.sales.enabled === false)
        return;
    try {
        let sales = await getSales(client, groupID);
        if (!sales)
            throw ("Skip check");
        if (!oldDates.find(v => v.id === groupID))
            oldDates.push({ id: groupID, date: sales[0].created });
        let dateIndex = oldDates.findIndex(v => v.id === groupID);
        let saleIndex = sales.findIndex(log => log.created.toISOString() === oldDates[dateIndex].date.toISOString());
        if (saleIndex === 0 || saleIndex === -1)
            throw ("Skip check");
        for (let i = saleIndex - 1; i >= 0; i--) {
            let log = sales[i];
            let channel = await client.channels.fetch(config_1.default.logging.sales.loggingChannel);
            if (channel) {
                let embed = client.embedMaker({ title: "New Sale", description: `**${log.agent.name}** has bought **${log.details.name}** for **${log.currency.amount}** robux after tax from **${GroupHandler_1.default.getNameFromID(groupID)}**`, type: "info", author: client.user });
                await channel.send({ embeds: [embed] });
            }
        }
        oldDates[dateIndex].date = sales[0].created;
    }
    catch (e) {
        if (e !== "Skip check") {
            console.error(`There was an error while trying to check the sale logs: ${e}`);
        }
    }
    setTimeout(async () => {
        await checkSales(groupID, client);
    }, 5000);
}
