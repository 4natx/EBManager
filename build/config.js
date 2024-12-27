"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValues = void 0;
require('dotenv').config();
exports.envValues = ["DISCORD_TOKEN", "ROBLOX_COOKIE", "ROBLOX_API_KEY", "VERIFICATION_PROVIDER_API_KEY"];
for (let i = 0; i < exports.envValues.length; i++) {
    if (!process.env[exports.envValues[i]]) {
        console.log(`${exports.envValues[i]} not defined in .env file`);
        process.exit(1);
    }
}
const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    ROBLOX_COOKIE: process.env.ROBLOX_COOKIE,
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
    VERIFICATION_PROVIDER_API_KEY: process.env.VERIFICATION_PROVIDER_API_KEY,
    groupIds: [15859709],
    permissions: {
        all: ["1130137372907032647"],
        group: {
            shout: [""],
            ranking: ["1044173223073427466"],
            joinrequests: ["1044173223073427466"],
            user: [""],
            xp: [""],
            wall: [""]
        },
        game: {
            general: [""],
            broadcast: [""],
            kick: [""],
            ban: [""],
            shutdown: [""],
            datastore: [""],
            execution: [""],
            jobIDs: [""],
            lock: [""],
            mute: [""]
        }
    },
    antiAbuse: {
        enabled: true,
        thresholds: {
            ranks: 10,
            exiles: 5
        },
        actions: {
            ranks: "Suspend",
            exiles: "Exile"
        }
    },
    xpSystem: {
        enabled: false,
        rewards: [],
        earnings: {
            messages: 2,
            reactions: 1
        }
    },
    counting: {
        enabled: false,
        goal: 0,
        loggingChannel: ""
    },
    logging: {
        audit: {
            enabled: true,
            loggingChannel: "1269836984671539241"
        },
        shout: {
            enabled: true,
            loggingChannel: "1269836984671539241"
        },
        command: {
            enabled: true,
            loggingChannel: "1269836984671539241"
        },
        antiAbuse: {
            enabled: true,
            loggingChannel: "1269836984671539241"
        },
        sales: {
            enabled: false,
            loggingChannel: "1269836984671539241"
        },
        xp: {
            enabled: false,
            loggingChannel: ""
        }
    },
    embedColors: {
        info: "Blue",
        success: "Green",
        error: "Red"
    },
    ban: {
        banDiscordAccounts: true,
        useSamePrivateReasonForDisplay: false,
        displayReason: "You've been banned from this game",
        excludeAlts: false,
    },
    defaultCooldown: 5000,
    cooldownOverrides: {}, // Format: {"command name": cooldownInMilliSeconds} ; EX: {"exile": 20000}
    suspensionRank: 0,
    universes: [],
    datastoreName: "moderations",
    verificationChecks: true,
    collectorTime: 120000,
    maximumNumberOfUsers: 5,
    lockedRanks: [],
    lockedCommands: [],
    verificationProvider: "bloxlink"
};
exports.default = config;
