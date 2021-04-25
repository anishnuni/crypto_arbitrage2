const ccxt = require('ccxt');
const Utils = require('./Utils');

const binance = new ccxt.binance({'enableRateLimit': true});
const binance_root = "https://api.binance.com/api/v3";


// Uses Binance API and loops through
// Took 6 minutes and 17 seconds on Sunday April 25th 3:30 am
async function update_Binance_data() {
    const exchangeInfo = await Utils.get(binance_root, "/exchangeInfo");
    // TODO fix after checking msg when it is not broken.
    const tradeable_markets = exchangeInfo["symbols"].filter((market) => (market["status"] === "TRADING"));
    const tradeable_tickers = tradeable_markets.map((market) => ({"quote": market["quoteAsset"], "base": market["baseAsset"]}));

    let orderbooks = [];
    let i = 0;
    for (let ticker of tradeable_tickers) {
        let market = {};
        market['base'] = ticker['base'].toUpperCase();
        market['quote'] = ticker['quote'].toUpperCase();
        try {
            let orderbook = await Utils.get(binance_root, "/depth?symbol=" + market['base'] + market['quote']);
            if (orderbook['code'] !== -1121) {
                let bids = [];
                let asks = [];
                for (let bid of orderbook['bids']) {
                    bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])});
                }
                for (let ask of orderbook['asks']) {
                    asks.push({"quantity": parseFloat(ask[1]), "rate": parseFloat(ask[0])});
                }
                market['bids'] = Utils.get_ordered_bids(bids);
                market['asks'] = Utils.get_ordered_asks(asks);
                orderbooks.push(market);
            }
        } catch (error) {
            console.log("Failed on get", binance_root, "/depth?symbol=" + market['base'] + market['quote']);
        }
        i++;
        let percent_done = ((100 * i / tradeable_tickers.length).toFixed(3));
        console.log(percent_done.toString() + "%", "done with Binance Data");
    }
    Utils.write_to_file("Binance_Orderbooks.json", orderbooks);
}

update_Binance_data();

// Uses CCXT and loops through markets
async function update_Binance_data1() {
    let responses = await binance.fetchMarkets();
    let orderbooks = [];
    let i = 0;
    for (let response of responses) {
        let market = {};
        market['base'] = response['base'].toUpperCase();
        market['quote'] = response['quote'].toUpperCase();
        let orderbook = await binance.fetchOrderBook(response['symbol']);
        let bids = [];
        let asks = [];
        for (let bid of orderbook['bids']) {
            bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])});
        }
        for (let ask of orderbook['asks']) {
            asks.push({"quantity": parseFloat(ask[1]), "rate": parseFloat(ask[0])});
        }
        market['bids'] = Utils.get_ordered_bids(bids);
        market['asks'] = Utils.get_ordered_asks(asks);
        orderbooks.push(market);
        i++;
        let percent_done = ((100 * i / responses.length).toFixed(3));
        console.log(percent_done.toString() + "%", "done with Binance Data");
    }
    Utils.write_to_file("Binance_Orderbooks.json", orderbooks);
}


// Uses CCXT and batches together calls
async function update_Binance_data2() {
    const responses = await binance.fetchMarkets();
    const tickers = responses.map(response => response['symbol']);

    const tickers1 = tickers.slice(0, 1000);
    const responses1 = responses.slice(0,1000);

    const tickers2 = tickers.slice(1000, tickers.length);
    const responses2 = responses.slice(1000,tickers.length);

    let gets1 = get_orderbook_queries(tickers1);
    let orderbooks1 = await get_orderbooks_given_queries(responses1, gets1);

    let gets2 = get_orderbook_queries(tickers2);
    let orderbooks2 = await get_orderbooks_given_queries(responses2, gets2)

    Utils.write_to_file("Binance_Orderbooks.json", orderbooks1.concat(orderbooks2));
}


function get_orderbook_queries(tickers) {
    let queries = [];
    for (let ticker of tickers) {
        queries.push(binance.fetchOrderBook(ticker));
    }
    return queries;
}


// get promises of the binance orderbooks and the tickers for each of them
async function get_orderbooks_given_queries(tickers, queries) {
    if (queries.length > 0) {
        let orderbooks = await Promise.all(queries).then((binance_orderbooks) => {
            let i = 0;
            let orderbooks = [];
            for (let binance_orderbook of binance_orderbooks) {
                let market = {};
                market['base'] = tickers[i]['base'].toUpperCase();
                market['quote'] = tickers[i]['quote'].toUpperCase();
                let bids = [];
                let asks = [];
                for (let bid of binance_orderbook['bids']) {
                    bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])});
                }
                for (let ask of binance_orderbook['asks']) {
                    asks.push({"quantity": parseFloat(ask[1]), "rate": parseFloat(ask[0])});
                }
                market['bids'] = Utils.get_ordered_bids(bids);
                market['asks'] = Utils.get_ordered_asks(asks);
                orderbooks.push(market);
                i++;
            }
            return orderbooks;
        });
        return orderbooks;
    } else {
        return [];
    }
}


module.exports = { update_Binance_data }