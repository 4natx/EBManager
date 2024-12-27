"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ms_1 = __importDefault(require("ms"));
const BotClient_1 = __importDefault(require("./BotClient"));
const config_1 = __importDefault(require("../../config"));
class BanService extends BotClient_1.default {
    static async ban(universeID, userID, reason, durationInSeconds) {
        if (durationInSeconds)
            durationInSeconds = `${durationInSeconds}s`;
        let res = await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config_1.default.ROBLOX_API_KEY
            },
            body: {
                gameJoinRestriction: {
                    active: true,
                    duration: durationInSeconds, // When it does JSON.stringify(), if durationInSeconds is undefined, the duration field is removed, making the ban indefinite
                    privateReason: reason,
                    displayReason: (config_1.default.ban.useSamePrivateReasonForDisplay ? reason : config_1.default.ban.displayReason),
                    excludeAltAccounts: config_1.default.ban.excludeAlts
                }
            },
            robloxRequest: false
        });
        let body = await res.json();
        if (body.message)
            return { success: false, err: body.message };
        return { success: true };
    }
    static async unban(universeID, userID) {
        await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config_1.default.ROBLOX_API_KEY
            },
            body: {
                gameJoinRestriction: {
                    active: false
                }
            },
            robloxRequest: false
        });
    }
    static async getBanData(universeID, userID) {
        let res = await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config_1.default.ROBLOX_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        let restirctionData = (await res.json()).gameJoinRestriction;
        let data = { isBanned: restirctionData.active, reason: restirctionData.privateReason };
        if (restirctionData.duration) {
            data.releaseTime = Date.parse(restirctionData.startTime) + (0, ms_1.default)(restirctionData.duration);
        }
        return data;
    }
}
exports.default = BanService;
