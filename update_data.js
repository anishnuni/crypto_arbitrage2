const Bittrex = require('./Acquiring_Data/Bittrex');
const CoinDCX = require('./Acquiring_Data/CoinDCX');
const Binance = require('./Acquiring_Data/Binance');
const WazirX = require('./Acquiring_Data/WazirX');
const AAX = require('./Acquiring_Data/AAX');
const FTX = require('./Acquiring_Data/FTX');
const GoPax = require('./Acquiring_Data/GoPax');
const Known_Assets = require('./Acquiring_Data/Known_Assets');
const Arb_Utils = require('./Arb_Utils');
const exchange_names = ["Bittrex", "CoinDCX", "Binance", "WazirX", "AAX", "FTX", "GoPax"];
// Run this file to update all the Saved_Data

async function update_all() {
    let updates = []
    updates.push(AAX.update_aax_data());
    updates.push(CoinDCX.update_coindcx_data());
    updates.push(WazirX.update_wazirx_data());
    updates.push(Bittrex.update_bittrex_data());
    updates.push(Binance.update_binance_data());
    updates.push(FTX.update_ftx_data());
    updates.push(GoPax.update_gopax_data());
    updates.push(Known_Assets.update_Known_Assets_Data());
    Promise.all(updates).then((values) => {
        Arb_Utils.print_exchange_updated_times(exchange_names)
    })
}

update_all();

