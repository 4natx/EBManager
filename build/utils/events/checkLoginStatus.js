"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkLoginStatus;
const roblox = require("noblox.js");
async function checkLoginStatus(client) {
    try {
        await roblox.getCurrentUser();
        client.setStatusActivity();
        client.isLoggedIn = true;
    }
    catch (e) {
        client.setStatusActivity();
        client.isLoggedIn = false;
    }
    setTimeout(async () => {
        await checkLoginStatus(client);
    }, 10000);
}
