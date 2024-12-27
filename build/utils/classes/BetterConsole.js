"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
class BetterConsole {
    static log(message, force) {
        if (force) {
            console.log(message);
        }
        else {
            if (config_1.default.debug) {
                console.log(message);
            }
        }
    }
}
exports.default = BetterConsole;
