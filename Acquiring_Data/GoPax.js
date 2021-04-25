const ccxt = require('ccxt');
const Utils = require('./Utils');

const gopax = new ccxt.gopax({'enableRateLimit': true});
const gopax_root = "https://api.gopax.co.kr";

// Uses CCXT and loops through markets
async function update_gopax_data() {
    const markets = await gopax.fetchMarkets();
    const tradeable_markets = markets.filter((market) => (market['active']));

    let orderbooks = [];
    let i = 0;

    for (let market of tradeable_markets) {
        try {
            let orderbook = await Utils.get(gopax_root, "/trading-pairs/" + market['id'] + "/book");
            let to_save = {"base": market["base"], "quote": market["quote"]};

            let bids = [];
            let asks = [];

            for (let bid of orderbook['bid']) {
                bids.push({"quantity": parseFloat(bid[2]), "rate": parseFloat(bid[1])});
            }
            for (let ask of orderbook['ask']) {
                asks.push({"quantity": parseFloat(ask[2]), "rate": parseFloat(ask[1])});
            }

            to_save['bids'] = Utils.get_ordered_bids(bids);
            to_save['asks'] = Utils.get_ordered_asks(asks);
            orderbooks.push(to_save);
        } catch {
            console.log("Failed to load get orderbook on GoPax Market", market['id']);
        }
        i++;
        Utils.log_exchange_progress(i / tradeable_markets.length, "GoPax");
    }
    Utils.write_to_file("GoPax_Orderbooks.json", orderbooks, true);
}



module.exports = { update_gopax_data }