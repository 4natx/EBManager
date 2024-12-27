"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const noblox_js_1 = __importDefault(require("noblox.js"));
const BetterConsole_1 = __importDefault(require("./BetterConsole"));
const config_1 = __importDefault(require("../../config"));
class VerificationHelpers {
    static async preformVerificationChecks(groupID, robloxID, permissionNeeded, victimUserID) {
        if (!config_1.default.verificationChecks)
            return { success: true };
        let authorGroupRole = await noblox_js_1.default.getRankInGroup(groupID, robloxID);
        if (authorGroupRole === 0)
            return { success: false, err: "User is not in group" };
        let permissions = await this.getPermissions(groupID, robloxID);
        if (!permissions[permissionNeeded])
            return { success: false, err: "User does not have required permission" };
        if (victimUserID) {
            let victimGroupRole = await noblox_js_1.default.getRankInGroup(groupID, victimUserID);
            if (victimGroupRole >= authorGroupRole)
                return { success: false, err: "User does not have permission to manage other user" };
        }
        return { success: true };
    }
    static async getRobloxUser(guildID, discordID) {
        let index = this.discordToRobloxCache.findIndex(v => v.discordID === discordID);
        if (index != -1) {
            if (Date.now() - this.discordToRobloxCache[index].timeAdded >= 300_000) { // Remove cache items if older than 5 minutes
                this.discordToRobloxCache.splice(index, 1);
            }
            else {
                return this.discordToRobloxCache[index].robloxID;
            }
        }
        try {
            if (config_1.default.verificationProvider === "rover") {
                return this.getRobloxUserUsingRover(guildID, discordID);
            }
            else if (config_1.default.verificationProvider === "rowifi") {
                return this.getRobloxUserUsingRowifi(guildID, discordID);
            }
            else {
                return this.getRobloxUserUsingBloxlink(guildID, discordID);
            }
        }
        catch (e) {
            BetterConsole_1.default.log(`Error while trying to fetch a Roblox ID: ${e}`, true);
            return 0;
        }
    }
    static async getDiscordUsers(guildID, robloxID) {
        let index = this.robloxToDiscordCache.findIndex(v => v.robloxID === robloxID);
        if (index != -1) {
            if (Date.now() - this.robloxToDiscordCache[index].timeAdded >= 300_000) { // Remove cache items if older than 5 minutes
                this.robloxToDiscordCache.splice(index, 1);
            }
            else {
                return this.robloxToDiscordCache[index].discordIDs;
            }
        }
        try {
            if (config_1.default.verificationProvider === "rover") {
                return this.getDiscordUsersUsingRover(guildID, robloxID);
            }
            else if (config_1.default.verificationProvider === "rowifi") {
                return this.getDiscordUsersUsingRowifi(guildID, robloxID);
            }
            else {
                return this.getDiscordUsersUsingBloxlink(guildID, robloxID);
            }
        }
        catch (e) {
            BetterConsole_1.default.log(`Error while trying to fetch Discord IDs: ${e}`, true);
            return [];
        }
    }
    static async getPermissions(groupID, rbxID) {
        let rank = await noblox_js_1.default.getRankInGroup(groupID, rbxID);
        let role = (await noblox_js_1.default.getRoles(groupID)).find(r => r.rank === rank);
        let permissions = (await noblox_js_1.default.getRolePermissions(groupID, role.id)).permissions;
        let permissionData = {
            "JoinRequests": permissions.groupMembershipPermissions.inviteMembers,
            "Ranking": permissions.groupMembershipPermissions.changeRank,
            "Shouts": permissions.groupPostsPermissions.postToStatus,
            "Exile": permissions.groupMembershipPermissions.removeMembers,
            "Wall": permissions.groupPostsPermissions.deleteFromWall
        };
        return permissionData;
    }
    static async request(requestOptions) {
        if (requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await noblox_js_1.default.getGeneralToken(),
                "Cookie": `.ROBLOSECURITY=${config_1.default.ROBLOX_COOKIE}`,
                ...requestOptions.headers
            };
        }
        BetterConsole_1.default.log(requestOptions);
        return await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: JSON.stringify(requestOptions.body)
        });
    }
    static async getRobloxUserUsingRover(guildID, discordID) {
        let res = await this.request({
            url: `https://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${config_1.default.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let rbxID = (await res.json()).robloxId;
            this.discordToRobloxCache.push({ discordID: discordID, robloxID: rbxID, timeAdded: Date.now() });
            return rbxID;
        }
        else {
            let headers = res.headers;
            if (parseInt(headers.get("X-RateLimit-Remaining")) === 0) {
                console.error("Rover API limit reached");
                setTimeout(async () => {
                    return await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("X-RateLimit-Reset-After")) * 1000);
            }
            else if (res.status === 429) {
                console.error("Rover API limit reached");
                setTimeout(async () => {
                    return await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("Retry-After")) * 1000);
            }
            else {
                return 0;
            }
        }
    }
    static async getRobloxUserUsingRowifi(guildID, discordID) {
        let res = await this.request({
            url: `https://api.rowifi.xyz/v2/guilds/${guildID}/members/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${config_1.default.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let rbxID = (await res.json()).roblox_id;
            this.discordToRobloxCache.push({ discordID: discordID, robloxID: rbxID, timeAdded: Date.now() });
            return rbxID;
        }
        return 0;
    }
    static async getRobloxUserUsingBloxlink(guildID, discordID) {
        let res = await this.request({
            url: `https://api.blox.link/v4/public/guilds/${guildID}/discord-to-roblox/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": config_1.default.VERIFICATION_PROVIDER_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let rbxID = (await res.json()).robloxID;
            this.discordToRobloxCache.push({ discordID: discordID, robloxID: rbxID, timeAdded: Date.now() });
            return rbxID;
        }
        return 0;
    }
    static async getDiscordUsersUsingRover(guildID, robloxID) {
        let res = await this.request({
            url: `https://registry.rover.link/api/guilds/${guildID}/roblox-to-discord/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${config_1.default.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let rawUsers = (await res.json()).discordUsers;
            let users = [];
            for (let i = 0; i < rawUsers.length; i++) {
                users.push(rawUsers[i].user.id);
            }
            this.robloxToDiscordCache.push({ robloxID: robloxID, discordIDs: users, timeAdded: Date.now() });
            return users;
        }
        else {
            let headers = res.headers;
            if (parseInt(headers.get("X-RateLimit-Remaining")) === 0) {
                console.error("Rover API limit reached");
                setTimeout(async () => {
                    return await this.getDiscordUsers(guildID, robloxID);
                }, parseInt(headers.get("X-RateLimit-Reset-After")) * 1000);
            }
            else if (res.status === 429) {
                console.error("Rover API limit reached");
                setTimeout(async () => {
                    return await this.getDiscordUsers(guildID, robloxID);
                }, parseInt(headers.get("Retry-After")) * 1000);
            }
            else {
                return [];
            }
        }
    }
    static async getDiscordUsersUsingRowifi(guildID, robloxID) {
        let res = await this.request({
            url: `https://api.rowifi.xyz/v2/guilds/${guildID}/members/roblox/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${config_1.default.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let rawUsers = await res.json();
            let users = [];
            for (let i = 0; i < rawUsers.length; i++) {
                users.push(rawUsers[i].discord_id);
            }
            this.robloxToDiscordCache.push({ robloxID: robloxID, discordIDs: users, timeAdded: Date.now() });
            return users;
        }
        return [];
    }
    static async getDiscordUsersUsingBloxlink(guildID, robloxID) {
        let res = await this.request({
            url: `https://api.blox.link/v4/public/guilds/${guildID}/roblox-to-discord/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": config_1.default.VERIFICATION_PROVIDER_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        if (res.status === 200) {
            let users = (await res.json()).discordIDs;
            this.robloxToDiscordCache.push({ robloxID: robloxID, discordIDs: users, timeAdded: Date.now() });
            return users;
        }
        return [];
    }
}
VerificationHelpers.discordToRobloxCache = [];
VerificationHelpers.robloxToDiscordCache = [];
exports.default = VerificationHelpers;
