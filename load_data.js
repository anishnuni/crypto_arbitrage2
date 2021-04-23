const fs = require('fs');
// This file contains useful functions to load specific
// information from the saved exchange order book data files.

// load all markets for exchange_name from file
function load_all_markets(exchange_name) {
    let path = "./Saved_Data/" + exchange_name + "_Orderbooks.json";
    let file = JSON.parse(fs.readFileSync(path));
    return file['data'];
}

// get all orderbooks that include the given asset
// returns a dictionary of tickers and their orderbooks 
// where all the tickers in the dictionary include the given asset
// asset should be in lowercase ex. "inr" or "btc"
function get_markets(markets, asset) {
    let ans = [];
    for (let market of markets) {
        if (market['base'] === asset || market['quote'] === asset) {
            ans.push(market);
        }
    }
    return ans;
}


// load the orderbook from the dictionary of orderbooks with 
// the specified base and target assets
// base and target should be lowercase. 
function get_market(markets, base, quote) {
    for (market of markets) {
        let base_equal = (market['base'] === base);
        let quote_equal = (market['quote'] === quote);
        if (base_equal && quote_equal) {
            return market;
        }
    }
    return "Failed to Find Market";
}

// Given an asset with ticker asset and some number of that asset
// (asset_n), figure out how much of the other asset you can get for it.
// given an orderbook. You may not be able to convert all asset_n of asset
// into the other asset in the market. In this case the function
// just returns how much of the other asset you will get if you
// convert as much as you can of asset_n
function conversion(market, asset_n, asset) {
    let output_n = 0;
    if (market['quote'] === asset) {
        let asks = market['asks'];
        for (let order of asks) {
            if (asset_n > 0) {
                let order_size = order['rate'] * order['quantity'];
                let asset_used_on_order = Math.min(order_size, asset_n);
                asset_n -= asset_used_on_order;
                output_n += asset_used_on_order / order['rate'];
            }
        }
    } else if (market['base'] === asset) {
        let bids = market['bids'];
        for (let order of bids) {
            if (asset_n > 0) {
                let asset_used_on_order = Math.min(order['quantity'], asset_n);
                asset_n -= asset_used_on_order;
                output_n += asset_used_on_order * order['rate'];
            }
        }
    }
    return output_n;
}



// sum of the quantity on all the bids orders
function total_volume_bids(asks) {
    let quantity = 0;
    for (let order of asks) {
        quantity += order['quantity'];
    }
    return quantity
}


function total_volume_asks(bids) {
    let quantity = 0;
    for (let order of bids) {
        let order_quantity = parseFloat(order['quantity']);
        let order_rate = parseFloat(order['rate']);
        quantity = quantity + order_quantity * order_rate;
    }
    return quantity;
}


module.exports = { load_orderbook: load_all_markets, get_markets, get_market, conversion }