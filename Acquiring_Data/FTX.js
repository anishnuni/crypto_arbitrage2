const ccxt = require('ccxt');
const Utils = require('./Utils');

const ftx = new ccxt.ftx({'enableRateLimit': true});

// Uses CCXT and loops through markets
// ONLY SAVES SPOT MARKETS
async function update_ftx_data() {
    const markets = await ftx.fetchMarkets();
    const tradeable_spot_markets = markets.filter((market) =>
        (market['active'] && market['spot'] && market['info']['enabled']));
    let orderbooks = [];
    let i = 0;

    for (let market of tradeable_spot_markets) {
        let orderbook = await ftx.fetchOrderBook(market['symbol']);
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
        Utils.log_exchange_progress(i / tradeable_markets.length, "FTX");
    }
    Utils.write_to_file("FTX_Orderbooks.json", orderbooks, true);
}



module.exports = { update_ftx_data }