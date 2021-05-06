const Utils = require('./Utils');

// get base and quote asset from the CoinDCX ticker name
function coindcx_get_assets(ticker) {
    ticker = ticker.substring(2, ticker.length);
    let l = ticker.split("_");
    if (l[0][0] === "-") {
        l[0] = l[0].substring(1, l[0].length);
    }
    return {"base": (l[0]).toUpperCase(), "quote": (l[1]).toUpperCase()};
}


// download data for CoinDCX markets
async function update_coindcx_data() {
    const markets = await Utils.get("https://api.coindcx.com", "/exchange/v1/markets_details");
    const tradeable_markets = markets.filter((market) => (market["status"] === "active"))
    const tradeable_pairs = tradeable_markets.map(market => market['pair']);
    let orderbooks = [];

    let valid_pairs = [];
    for (let pair of tradeable_pairs) {
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
        Utils.log_exchange_progress(i / tradeable_markets.length, "CoinDCX");
    }
    Utils.write_to_file("CoinDCX/CoinDCX_Orderbooks.json", orderbooks, true);
}


module.exports = { update_coindcx_data, coindcx_get_assets }