const Bittrex = require('./Bittrex');
const CoinDCX = require('./CoinDCX');
const Binance = require('./Binance');
const WazirX = require('./WazirX');
const AAX = require('./AAX');
const FTX = require('./FTX');
const GoPax = require('./GoPax');
const Known_Assets = require('./Known_Assets');
// Run this file to update all the Saved_Data

function update_all() {
    // AAX.update_aax_data();
    // CoinDCX.update_coindcx_data();
    // WazirX.update_wazirx_data();
    Bittrex.update_bittrex_data();
    //Binance.update_binance_data();
    // FTX.update_ftx_data();
    // GoPax.update_gopax_data();
    Known_Assets.update_Known_Assets_Data();
}

update_all();