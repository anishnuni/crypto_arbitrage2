const Utils = require('./Utils');
const Bittrex_root = "https://api.bittrex.com/v3";

// get base and quote asset from the Bittrex ticker name
function bittrex_get_assets(ticker) {
    let l = ticker.split("-");
    return {"base": (l[0]).toUpperCase(), "quote": (l[1]).toUpperCase()};
}


// gets the orderbook of every Bittrex market and saves it to a file in the Saved_Data folder.
async function update_Bittrex_data() {
    const markets = await Utils.get(Bittrex_root, "/markets/tickers");
    const market_symbols = markets.map(market => market['symbol']);
    let orderbooks = [];
    let i = 0;
    for (let symbol of market_symbols) {
        let response = await Utils.get(Bittrex_root, "/markets/" + symbol + "/orderbook");
        let market = bittrex_get_assets(symbol);
        let bids = [];
        let asks = [];
        for (let bid of response['bid']) {
            bids.push({"quantity": parseFloat(bid['quantity']), "rate": parseFloat(bid['rate'])})
        }
        for (let ask of response['ask']) {
            asks.push({"quantity": parseFloat(ask['quantity']), "rate": parseFloat(ask['rate'])})
        }
        market['bids'] = Utils.get_ordered_bids(bids);
        market['asks'] = Utils.get_ordered_asks(asks);
        orderbooks.push(market);
        i++;
        let percent_done = ((100 * i / market_symbols.length).toFixed(3));
        console.log(percent_done.toString() + "%", "done with Bittrex Saved_Data");
    }
    Utils.write_to_file("Bittrex_Orderbooks.json", orderbooks);
}


module.exports = { update_Bittrex_data }