"use strict";
// Use this file to convert from the pre-2.5 database structure to the 2.5+ database structure
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
fs_1.default.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8").then(async (fileContent) => {
    let banFileContent = JSON.parse(fileContent);
    let suspensionFileContent = JSON.parse(await fs_1.default.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8"));
    if (Array.isArray(banFileContent) || Array.isArray(suspensionFileContent))
        return; // Means that you already did the conversion
    let newBans = [];
    for (let i = 0; i < banFileContent.userIDs.length; i++) {
        newBans.push({ groupID: config_1.default.groupId, userID: banFileContent.userIDs[i] });
    }
    let newSuspensions = [];
    for (let i = 0; i < suspensionFileContent.users.length; i++) {
        newSuspensions.push({
            groupID: config_1.default.groupId,
            userId: suspensionFileContent.users[i].userId,
            reason: suspensionFileContent.users[i].reason,
            oldRoleID: suspensionFileContent.users[i].oldRoleID,
            timeToRelease: suspensionFileContent.users[i].timeToRelease
        });
    }
    await fs_1.default.promises.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(newBans));
    await fs_1.default.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(newSuspensions));
});
