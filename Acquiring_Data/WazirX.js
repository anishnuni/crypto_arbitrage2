const Utils = require('./Utils');
const axios = require('axios');
const Wazir_root = "https://api.wazirx.com/api/v2";

// get base and quote asset from the WazirX ticker name
function wazir_get_assets(ticker) {
    let quote_3 = ticker.substring(ticker.length - 3, ticker.length);
    let quote_4 = ticker.substring(ticker.length - 4, ticker.length);
    if (["btc", "inr", "wrx"].includes(quote_3)) {
        return {"base": (ticker.substring(0, ticker.length - 3)).toUpperCase(), "quote": quote_3.toUpperCase()}
    } else if (quote_4 == "usdt") {
        return {"base": (ticker.substring(0, ticker.length - 4)).toUpperCase(), "quote": quote_4.toUpperCase()}
    } else {
        throw "Failed on " + ticker;
    }
}


async function update_WazirX_data() {
    const ticker_data = await Utils.get(Wazir_root, "/tickers");
    const tickers = Object.keys(ticker_data);
    let orderbooks = [];
    let i = 0;
    for (let ticker of tickers) {
        try {
            let response = await Utils.get(Wazir_root, "/depth?market=" + ticker)
            let market = wazir_get_assets(ticker);
            let bids = [];
            let asks = [];
            for (let bid of response['bids']) {
                bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])})
            }
            for (let bid of response['asks']) {
                asks.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])})
            }
            market['bids'] = Utils.get_ordered_bids(bids);
            market['asks'] = Utils.get_ordered_asks(asks);
            orderbooks.push(market);
            i++;
            let percent_done = ((100 * i / tickers.length).toFixed(3));
            console.log(percent_done.toString() + "%", "done with WazirX Saved_Data");
        } catch {
            console.log("Encountered issue when acquiring a WazirX Market");
        }
    }
    Utils.write_to_file("Wazir_Orderbooks.json", orderbooks);

}


module.exports = { update_WazirX_data }