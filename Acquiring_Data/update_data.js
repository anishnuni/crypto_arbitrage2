const Bittrex = require('Bittrex');
const CoinDCX = require('CoinDCX');
const Binance = require('Binance');
const WazirX = require('WazirX');
// Run this file to update all the Saved_Data

function update_all() {
    Bittrex.update_Bittrex_data();
    CoinDCX.update_CoinDCX_data();
    WazirX.update_WazirX_data();

}

