"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ms_1 = __importDefault(require("ms"));
const config_1 = __importDefault(require("../../config"));
const __1 = require("../..");
class CommandHelpers {
    static loadArguments(interaction) {
        let options = interaction.options.data;
        let args = {};
        if (options.length === 0)
            return args;
        for (let i = 0; i < options.length; i++) {
            if (options[i].options) {
                for (let x = 0; x < options[i].options.length; x++) {
                    args[options[i].options[x].name] = options[i].options[x].value;
                }
            }
            else {
                args[options[i].name] = options[i].value;
            }
        }
        if (options[0].options) {
            args["subcommand"] = options[0].name; // Expose the subcommand used if available because the documented way doesn't fucking exist
        }
        return args;
    }
    static checkPermissions(command, user) {
        if (command.commandData.useDiscordPermissionSystem) {
            let permissionsRequired = command.commandData.permissions;
            for (let i = 0; i < permissionsRequired.length; i++) {
                if (user.permissions.has(permissionsRequired[i]))
                    return true;
            }
            return false;
        }
        else {
            let roleIDsRequired = command.commandData.permissions;
            if (!roleIDsRequired)
                return true;
            roleIDsRequired = roleIDsRequired.concat(config_1.default.permissions.all);
            if (user.roles.cache.some(role => roleIDsRequired.includes(role.id)))
                return true;
            return false;
        }
    }
    static parseReasons(usernames, rawReasons) {
        if (!rawReasons) {
            let reasons = [];
            while (true) {
                if (reasons.length === usernames.length)
                    break;
                reasons.push("Nenhum motivo fornecido");
            }
            return { parsedReasons: reasons, didError: false };
        }
        else {
            let reasons = rawReasons.split(",");
            if (reasons.length === 1) {
                while (true) {
                    if (reasons.length === usernames.length)
                        break;
                    reasons.push(reasons[0]);
                }
                return { parsedReasons: reasons, didError: false };
            }
            else if (reasons.length !== usernames.length) {
                return { parsedReasons: [], didError: true };
            }
        }
    }
    static parseTimes(usernames, rawTimes) {
        let times = rawTimes.replaceAll(" ", "").split(",");
        if (times.length === 1) {
            if (!(0, ms_1.default)(times[0])) {
                return { parsedTimes: [], didError: true };
            }
            times[0] = (0, ms_1.default)(times[0]);
            while (true) {
                if (times.length === usernames.length)
                    break;
                times.push(times[0]);
            }
            return { parsedTimes: times, didError: false };
        }
        else if (times.length === usernames.length) {
            let newTimes = [];
            for (let i = 0; i < times.length; i++) {
                let newTime = (0, ms_1.default)(times[i]);
                if (!newTime)
                    return { parsedTimes: [], didError: true };
                newTimes.push(newTime);
            }
            return { parsedTimes: newTimes, didError: false };
        }
        else {
            return { parsedTimes: [], didError: true };
        }
    }
    static getGroupCommands() {
        let categories = ["General Group", "Join Request", "Ranking", "Shout", "User", "XP"];
        let cmds = [];
        for (let i = 0; i < __1.commands.length; i++) {
            if (categories.includes(__1.commands[i].commandData.category)) {
                cmds.push(__1.commands[i].name);
            }
        }
        return cmds;
    }
    static getGameCommands() {
        let categories = ["Ban", "Database", "General Game", "JobID", "Lock", "Mute"];
        let cmds = [];
        for (let i = 0; i < __1.commands.length; i++) {
            if (categories.includes(__1.commands[i].commandData.category)) {
                cmds.push(__1.commands[i].name);
            }
        }
        return cmds;
    }
    static getXPCommands() {
        let cmds = [];
        for (let i = 0; i < __1.commands.length; i++) {
            if (__1.commands[i].commandData.category === "XP") {
                cmds.push(__1.commands[i].name);
            }
        }
        return cmds;
    }
}
CommandHelpers.allowedCommands = ["checkuser"];
exports.default = CommandHelpers;
