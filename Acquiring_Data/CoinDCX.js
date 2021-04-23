const Utils = require('./Utils');

// get base and quote asset from the CoinDCX ticker name
function coindcx_get_assets(ticker) {
    ticker = ticker.substring(2, ticker.length);
    let l = ticker.split("_");
    return {"base": (l[0]).toUpperCase(), "quote": (l[1]).toUpperCase()};
}


// download data for CoinDCX markets
async function update_CoinDCX_data() {
    const markets = await Utils.get("https://api.coindcx.com", "/exchange/v1/markets_details");
    const pairs = markets.map(market => market['pair']);
    let orderbooks = [];

    let valid_pairs = [];
    for (let pair of pairs) {
        if (!['B', 'HB', 'H'].includes(pair.split("-")[0])) {
            // valid_pairs are those that actually are trading on CoinDCX, not just those
            // that are just connections to the orderbook of Binance or Huobi
            valid_pairs.push(pair);
        }
    }

    let i = 0;
    // only looking at pairs not from Binance or Huobi
    for (let pair of valid_pairs) {
        let response = await Utils.get("https://public.coindcx.com", "/market_data/orderbook?pair=" + pair)
        let market = coindcx_get_assets(pair);
        let bids = [];
        let asks = [];
        for (let [rate, quantity] of Object.entries(response['bids'])) {
            bids.push({"quantity": parseFloat(quantity), "rate": parseFloat(rate)});
        }
        for (let [rate, quantity] of Object.entries(response['asks'])) {
            asks.push({"quantity": parseFloat(quantity), "rate": parseFloat(rate)});
        }
        market['bids'] = Utils.get_ordered_bids(bids);
        market['asks'] = Utils.get_ordered_asks(asks);
        orderbooks.push(market);
        i++;
        let percent_done = ((100 * i / valid_pairs.length).toFixed(3));
        console.log(percent_done.toString() + "%", "done with CoinDCX Saved_Data");
    }
    Utils.write_to_file("CoinDCX_Orderbooks.json", orderbooks);
}


module.exports = { update_CoinDCX_data }