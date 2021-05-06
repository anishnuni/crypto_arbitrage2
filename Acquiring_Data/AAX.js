const ccxt = require('ccxt');
const Utils = require('./Utils');
const Config = require('../config.json');

const api_key = Config["AAX No Trade API"]["key"];
const secret = Config["AAX No Trade API"]["secret"];

const exchangeId = 'aax';
const exchangeClass = ccxt[exchangeId];
const aax = new exchangeClass ({
    'apiKey': api_key,
    'secret': secret,
    'timeout': 30000,
    'enableRateLimit': true,
});


// was not able to find a way to check if deposits/withdrawals are live.
async function update_aax_data() {
    update_aax_orderbooks();
}


// TODO @Grekko
async function update_aax_withdraw_deposit_data() {
    // API Query:
}


// Uses CCXT and loops through markets
// Only includes markets that are actively trading
// Does not look at maker/taker fees
async function update_aax_orderbooks() {
    const maintenance = await Utils.get("https://api.aax.com", "/v2/announcement/maintenance");

    const markets = await aax.fetchMarkets();
    const tradeable_markets = markets.filter((market) => (market['info']['status'] === "enable"));
    let orderbooks = [];
    let i = 0;

    for (let market of tradeable_markets) {
        let orderbook = await aax.fetchOrderBook(market['symbol']);
        let to_save = {"base": market["base"], "quote": market["quote"]};

        let bids = [];
        let asks = [];

        for (let bid of orderbook['bids']) {
            bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])});
        }
        for (let ask of orderbook['asks']) {
            asks.push({"quantity": parseFloat(ask[1]), "rate": parseFloat(ask[0])});
        }
        to_save['bids'] = Utils.get_ordered_bids(bids);
        to_save['asks'] = Utils.get_ordered_asks(asks);
        orderbooks.push(to_save);

        i++;
        Utils.log_exchange_progress(i / tradeable_markets.length, "AAX");
    }
    Utils.write_to_file("AAX/AAX_Orderbooks.json", orderbooks, true);
}



module.exports = { update_aax_data }