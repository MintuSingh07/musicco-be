"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomId = generateRoomId;
const uuid_1 = require("uuid");
function generateRoomId() {
    const id = (0, uuid_1.v4)().replace(/-/g, "");
    return `${id.slice(0, 4)}-${id.slice(4, 7)}-${id.slice(7, 10)}`;
}
