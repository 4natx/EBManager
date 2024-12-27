"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BotClient_1 = __importDefault(require("./BotClient"));
const config_1 = __importDefault(require("../../config"));
class MessagingService extends BotClient_1.default {
    static async sendMessage(universeID, type, payload) {
        await this.request({
            url: `https://apis.roblox.com/messaging-service/v1/universes/${universeID}/topics/DiscordModerationSystemCall`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config_1.default.ROBLOX_API_KEY
            },
            body: {
                message: JSON.stringify({ type: type, payload: payload })
            },
            robloxRequest: false
        });
    }
}
exports.default = MessagingService;
