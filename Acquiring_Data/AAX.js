const ccxt = require('ccxt');
const Utils = require('./Utils');

const aax = new ccxt.aax({'enableRateLimit': true});

// Uses CCXT and loops through markets
async function update_aax_data() {
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
    Utils.write_to_file("AAX_Orderbooks.json", orderbooks, true);
}



module.exports = { update_aax_data }