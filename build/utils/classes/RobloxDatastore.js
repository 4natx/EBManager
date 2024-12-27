"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roblox = require("noblox.js");
const BanService_1 = __importDefault(require("./BanService"));
const config_1 = __importDefault(require("../../config"));
class RobloxDatastore {
    static async getModerationData(universeID, userID) {
        let userData;
        try {
            userData = (await roblox.getDatastoreEntry(universeID, config_1.default.datastoreName, `${userID}-moderationData`)).data;
        }
        catch (e) {
            let err = e.toString();
            if (!err.includes("NOT_FOUND"))
                return { data: undefined, err: err };
            userData = {
                banData: {
                    isBanned: false,
                    reason: ""
                },
                muteData: {
                    isMuted: false,
                    reason: ""
                },
                warns: []
            };
        }
        let newBanData = await BanService_1.default.getBanData(universeID, userID);
        if (newBanData.isBanned) { // This would mean they are on v4.0.0+ which changes ban systems, making old data not needed
            if (userData.banData.isBanned) { // Migrate to new system and clear old data
                if (userData.banData.releaseTime) {
                    await BanService_1.default.ban(universeID, userID, userData.banData.reason, (userData.banData.releaseTime - Date.now()) / 1000);
                }
                else {
                    await BanService_1.default.ban(universeID, userID, userData.banData.reason);
                }
                this.setModerationData(universeID, userID, {
                    banData: {
                        isBanned: false,
                        reason: ""
                    },
                    muteData: userData.muteData,
                    warns: userData.warns
                });
            }
            userData.banData = newBanData;
        }
        return { data: userData };
    }
    static async setModerationData(universeID, userID, moderationData) {
        await roblox.setDatastoreEntry(universeID, config_1.default.datastoreName, `${userID}-moderationData`, moderationData);
    }
}
exports.default = RobloxDatastore;
