const { v4: uuidv4 } = require("uuid");

function generateRoomId() {
    const id = uuidv4().replace(/-/g, "");

    return `${id.slice(0, 4)}-${id.slice(4, 7)}-${id.slice(7, 10)}`;
}

module.exports = { generateRoomId };