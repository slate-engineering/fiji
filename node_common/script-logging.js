const { performance } = require("perf_hooks");

const TIME_START = performance.now();

const getTimestamp = (current, previous) => {
  return new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");
};

const getTime = () => {
  return `[ \x1b[35m\x1b[5m${getTimestamp(performance.now(), TIME_START)}\x1b[0m ]`;
};

export const socketError = (name, message) => {
  console.log(`\x1b[1m[ \x1b[31m${name}\x1b[0m\x1b[1m ]\x1b[0m ${getTime()} ${message}`);
};

export const socketMessage = (name, message) => {
  console.log(`\x1b[1m[ \x1b[32m${name}\x1b[0m\x1b[1m ]\x1b[0m ${getTime()} ${message}`);
};

export const log = (message, name = "SCRIPT") => {
  console.log(`\x1b[1m[ \x1b[32m${name}\x1b[0m\x1b[1m ]\x1b[0m ${message}`);
};
