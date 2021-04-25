const fs = require('fs');
// This file contains useful functions to load specific
// information from the saved exchange order book data files.

const Bittrex_Markets = load_data("Bittrex_Orderbooks.json");
const WazirX_Markets = load_data("WazirX_Orderbooks.json");
const CoinDCX_Markets = load_data("CoinDCX_Orderbooks.json");
const Binance_Markets = load_data("Binance_Orderbooks.json");

// load all markets for exchange_name from file
function load_data(filename) {
    let path = "./Saved_Data/" + filename;
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

// return best way to convert asset1_n of asset1 into asset2
// given the different sets of markets for different exchanges in the
// exchanges array.
function best_conversion(exchanges, exchange_names, asset1, asset1_n, asset2) {
    let best_option = {"exchange": "None", "asset1": asset1, "asset1_n": asset1_n, "asset2": asset2, "asset2_n": 0};
    if (asset1 === asset2) {
        best_option["asset2_n"] = asset1_n
        return best_option;
    }
    let i = 0;
    for (let exchange of exchanges) {
        let market1 = get_market(exchange, asset1, asset2);
        let market2 = get_market(exchange, asset2, asset1);

        let asset2_n_1 = conversion(market1, asset1_n, asset1);
        let asset2_n_2 = conversion(market2, asset1_n, asset1);

        let asset2_n = Math.max(asset2_n_1, asset2_n_2);
        if (asset2_n > best_option['asset2_n']) {
            best_option["exchange"] = exchange_names[i];
            best_option["asset2_n"] = asset2_n;
        }
        i++
    }
    return best_option
}


function array_median(arr) {
    const mid = Math.floor(arr.length / 2) ;
    const sorted_arr = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? sorted_arr[mid] : (sorted_arr[mid - 1] + sorted_arr[mid]) / 2;
}


function get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, asset) {
    const USD_alternatives = ["USD", "USDT", "BUSD", "USDC", "DAI", "BUSD", "TUSD"];
    let asset_n = [];
    for (let USD_coin of USD_alternatives) {
        let n = best_conversion(exchanges, exchange_names, USD_coin, sizing_USD, asset)['asset2_n'];
        asset_n.push(n);
    }

    const BTC_price = best_conversion(exchanges, exchange_names, "BTC", 0.5, "USDT")['asset2_n'] / 0.5;
    const ETH_price = best_conversion(exchanges, exchange_names, "ETH", 1, "USDT")['asset2_n'];

    // How much of the asset will you get if you convert sizing_USD worth of BTC into the asset
    let n_BTC = best_conversion(exchanges, exchange_names, "BTC", sizing_USD / BTC_price, asset)['asset2_n'];

    // How much of the asset will you get if you convert sizing_USD worth of ETH into the asset
    let n_ETH = best_conversion(exchanges, exchange_names, "ETH", sizing_USD / ETH_price, asset)['asset2_n'];

    asset_n.push(n_BTC);
    asset_n.push(n_ETH);

    const reasonable_answers = asset_n.filter(n => (n !== 0));
    if (reasonable_answers.length > 0) {
        return array_median(reasonable_answers);
    } else {
        throw "unable to get n_asset from USD for " + asset
    }
}


function get_best_conversion_matrix(exchanges, exchange_names, sizing_USD, log_progress) {
    console.log("Loading BC_Matrix...");
    const known_assets = JSON.parse(fs.readFileSync("./Saved_Data/known_assets.json"))['data'];
    let bc_matrix = {};
    let n = known_assets.length ** 2;
    let i = 0;
    for (let asset1 of known_assets) {
        bc_matrix[asset1] = {};
        try {
            // the ratio is calculated assuming you are selling less than 1.2*sizing_USD worth of asset1
            // this is why we are setting asset1_n in the following way
            let asset1_n = 1.2 * get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, asset1);

            for (let asset2 of known_assets) {
                let best = best_conversion(exchanges, exchange_names, asset1, asset1_n, asset2);
                bc_matrix[asset1][asset2] = best["asset2_n"] / best["asset1_n"];
                // How many of Asset 2 you can get for Asset 1
                // given that you are trying to sell less than asset1_n of Asset 1
                i++;
                let percent_done = ((100 * i / n).toFixed(3));
                if (log_progress) {
                    console.log(percent_done.toString() + "%", "done with bc_matrix");
                }
            }
        } catch {
            // Above we couldn't figure out the price of asset1
            // This probably means that it is super illiquid and we can't
            // trade even sizing_USD worth of it
            for (let asset2 of known_assets) {
                bc_matrix[asset1][asset2] = 0;
            }
            i += known_assets.length;
            let percent_done = ((100 * i / n).toFixed(3));
            if (log_progress) {
                console.log(percent_done.toString() + "%", "done with bc_matrix");
            }
        }
    }
    return bc_matrix;
}

// Given one asset in a market get the second one
function get_asset_2(market, asset_1) {
    if (market['quote'] === asset_1) {
        return market['base'];
    } else {
        return market['quote'];
    }
}

function load_all_exchanges() {
    return {
        "CoinDCX": CoinDCX_Markets,
        "WazirX": WazirX_Markets,
        "Bittrex": Bittrex_Markets,
        "Binance": Binance_Markets
    };
}


function load_all_tradeable_exchanges() {
    return {"CoinDCX": CoinDCX_Markets,
        "WazirX": WazirX_Markets,
        "Bittrex": Bittrex_Markets,
        "Binance": Binance_Markets
    };
}

module.exports = { load_data, best_conversion, get_best_conversion_matrix, load_all_tradeable_exchanges, load_all_exchanges, get_n_asset_from_USD_value, get_markets, get_market, conversion, get_asset_2 }