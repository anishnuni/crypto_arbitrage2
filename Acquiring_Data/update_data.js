const Bittrex = require('./Bittrex');
const CoinDCX = require('./CoinDCX');
const Binance = require('./Binance');
const WazirX = require('./WazirX');
const Known_Assets = require('./Known_Assets');
// Run this file to update all the Saved_Data

function update_all() {
    CoinDCX.update_CoinDCX_data();
    WazirX.update_WazirX_data();
    Bittrex.update_Bittrex_data();
    Binance.update_Binance_data();
    Known_Assets.update_Known_Assets_Data();
}

update_all();