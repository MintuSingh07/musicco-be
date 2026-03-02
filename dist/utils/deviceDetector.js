"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceInfo = getDeviceInfo;
const ua_parser_js_1 = require("ua-parser-js");
function getDeviceInfo(userAgent) {
    if (!userAgent) {
        return { device_type: 'Laptop', device_name: 'Unknown Device' };
    }
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const result = parser.getResult();
    console.log("Device info:", result);
    let device_type = 'Laptop';
    //? Map ua-parser-js device types to our format
    if (result.device.type === 'mobile') {
        device_type = 'Mobile';
    }
    else if (result.device.type === 'tablet') {
        device_type = 'Tablet';
    }
    else {
        // Default to Laptop for desktop browsers where device.type is usually undefined
        device_type = 'Laptop';
    }
    //? Construct device name
    let device_name = 'Unknown Device';
    if (result.device.vendor || result.device.model) {
        device_name = `${result.device.vendor || ''} ${result.device.model || ''}`.trim();
    }
    else if (result.os.name) {
        device_name = result.os.name;
        if (result.os.version) {
            device_name += ` ${result.os.version}`;
        }
    }
    // Cleaner device name for Mac/Apple
    const lowerName = device_name.toLowerCase();
    if (lowerName.includes('mac os') || lowerName.includes('macintosh') || (lowerName.includes('apple') && device_type === 'Laptop')) {
        device_name = 'MacBook';
    }
    return { device_type, device_name };
}
