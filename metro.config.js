const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// config.transformer = {
//   ...config.transformer,
//   cssInterop: {
//     enableCssInterop: true,
//     enableWorklets: false, // This disables worklets
//   },
// };

module.exports = config;
