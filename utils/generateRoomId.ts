import { v4 as uuidv4 } from 'uuid';

export function generateRoomId(): string {
    const id = uuidv4().replace(/-/g, "");

    return `${id.slice(0, 4)}-${id.slice(4, 7)}-${id.slice(7, 10)}`;
}