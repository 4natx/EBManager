"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = checkCooldowns;
function checkCooldowns(client) {
    for (let i = client.commandCooldowns.length - 1; i >= 0; i--) {
        if (Date.now() < client.commandCooldowns[i].cooldownExpires)
            continue;
        client.commandCooldowns.splice(i, 1);
    }
    setTimeout(() => {
        checkCooldowns(client);
    }, 5);
}
