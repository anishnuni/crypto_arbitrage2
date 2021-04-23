const ccxt = require('ccxt');
const Utils = require('./Utils');

const binance = new ccxt.binance({'enableRateLimit': true});

console.log(binance.symbols);