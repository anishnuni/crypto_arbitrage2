const Bittrex = require('./Acquiring_Data/Bittrex');
const CoinDCX = require('./Acquiring_Data/CoinDCX');
const Binance = require('./Acquiring_Data/Binance');
const WazirX = require('./Acquiring_Data/WazirX');
const AAX = require('./Acquiring_Data/AAX');
const FTX = require('./Acquiring_Data/FTX');
const GoPax = require('./Acquiring_Data/GoPax');
const Known_Assets = require('./Acquiring_Data/Known_Assets');
// Run this file to update all the Saved_Data

function update_all() {
    AAX.update_aax_data();
    CoinDCX.update_coindcx_data();
    WazirX.update_wazirx_data();
    Bittrex.update_bittrex_data();
    Binance.update_binance_data();
    FTX.update_ftx_data();
    GoPax.update_gopax_data();
    Known_Assets.update_Known_Assets_Data();
}

update_all();