const Loader = require('./load_data');
const Arb_Utils = require('./Arb_Utils');

const exchange_markets = Loader.load_all_tradeable_exchanges();
const exchange_names = Object.keys(exchange_markets);
const exchanges = Object.values(exchange_markets);

// File is focused on finding circular arbitrage arbitrage anywhere they may exist.

// Updates the BC_matrix.json file given the current saved orderbooks
function update_BC_matrix_Data(sizing_USD) {
    const bc_matrix = Loader.get_best_conversion_matrix(exchanges, exchange_names, sizing_USD);
    Arb_Utils.write_to_file("bc_matrix.json", bc_matrix);
}


// return dictionary of trades with an exchange rate greater than 0.
// Ex. valid_trades['ETH'] = ['USDT', 'BTC', 'UNI']
// means that ETH can be traded for more than 0 USDT, BTC or ETH
function get_valid_trades(bc_matrix) {
    const known_assets = Object.keys(bc_matrix)
    let valid_trades = {};
    for (let start_asset of known_assets) {
        // all exchange rates for start_asset:
        let asset_exchanges = bc_matrix[start_asset];
        // all assets that start_asset can be exchanged to with an exchange rate > 0
        let exchangeable_to = Object.keys(asset_exchanges).filter(end_asset => (asset_exchanges[end_asset] > 0));
        valid_trades[start_asset] = exchangeable_to;
    }
    return valid_trades;
}

function log_trades(trades) {
    let to_log = trades[0]["start_asset_n"] + " " + trades[0]["start_asset"];
    for (let trade of trades.slice(1, trades.length)) {
        to_log = to_log + " into " + trade["start_asset_n"] + " " + trade["start_asset"];
    }
    to_log = to_log + " into " + trades.pop()["end_asset_n"] + " " + trades.pop()["end_asset"];
    console.log(to_log);
}


// ...
function find_all_three_step_arbs(sizing_USD, min_successful_margin, log_BC_matrix_progress, log_all_trades) {
    const bc_matrix = Loader.load_data("bc_matrix.json");
    console.log("Finding Three Step Arbs...");
    const valid_trades = get_valid_trades(bc_matrix);

    // all assets that can be traded at the given sizing_USD:
    const tradeable_assets = Object.keys(valid_trades).filter(asset => (valid_trades[asset].length > 0));
    let successes = []

    for (let start_asset of tradeable_assets) {
        try {
            let start_asset_start_n = Loader.get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, start_asset);
            // list of possible asset2s (only possible if it can be converted back into start_asset)
            let asset2_list = valid_trades[start_asset];

            for (let asset2 of asset2_list) {
                let trade1 = Loader.best_conversion(exchanges, exchange_names, start_asset, start_asset_start_n, asset2);
                let asset2_n = trade1["end_asset_n"];

                let asset3_list = valid_trades[asset2].filter(asset3 => (valid_trades[asset3].includes(start_asset)));

                for (let asset3 of asset3_list) {
                    let trade2 = Loader.best_conversion(exchanges, exchange_names, asset2, asset2_n, asset3);
                    let asset3_n = trade2["end_asset_n"];

                    let trade3 = Loader.best_conversion(exchanges, exchange_names, asset3, asset3_n, start_asset);
                    let start_asset_end_n = trade3["end_asset_n"];
                    let trades = [trade1, trade2, trade3];

                    if (log_all_trades) {
                        log_trades(trades);
                    }

                    let margin = start_asset_end_n / start_asset_start_n;

                    if (margin > min_successful_margin) {
                        // If the "trade" isn't a real trade we don't need to print it in successes
                        let real_trades = trades.filter((trade) => (trade["exchange"] !== "None"));
                        let play = {"play_stats": {"margin": margin}, "trades": real_trades};
                        successes.push(play);
                    }
                }
                if (log_all_trades) {
                    console.log("");
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    return successes;
}


// ...
function find_all_two_step_arbs(sizing_USD, min_successful_margin, log_BC_matrix_progress, log_all_trades) {
    const bc_matrix = Loader.load_data("bc_matrix.json");
    console.log("Finding Two Step Arbs...");
    const valid_trades = get_valid_trades(bc_matrix);

    // all assets that can be traded at the given sizing_USD:
    const tradeable_assets = Object.keys(valid_trades).filter(asset => (valid_trades[asset].length > 0));
    let successes = []

    for (let start_asset of tradeable_assets) {
        try {
            let start_asset_start_n = Loader.get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, start_asset);
            // list of possible asset2s (only possible if it can be converted back into start_asset)
            let asset2_list = valid_trades[start_asset].filter(asset2 => (valid_trades[asset2].includes(start_asset)));
            for (let asset2 of asset2_list) {
                let trade1 = Loader.best_conversion(exchanges, exchange_names, start_asset, start_asset_start_n, asset2);
                let asset2_n = trade1["end_asset_n"];

                let trade2 = Loader.best_conversion(exchanges, exchange_names, asset2, asset2_n, start_asset);
                let trades = [trade1, trade2];

                if (log_all_trades) {
                    log_trades(trades);
                }
                let margin = trade2["end_asset_n"] / trade1["start_asset_n"];
                if (margin > min_successful_margin) {
                    let play = {"play_stats": {"margin": margin}, "trades": trades}
                    successes.push(play)
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    return successes;
}


function test() {
    const sizing_USD = 1000;
    const BTC_price = Loader.best_conversion(exchanges, exchange_names, "BTC", 0.5, "USDT")['end_asset_n'] / 0.5;
    const ETH_price = Loader.best_conversion(exchanges, exchange_names, "ETH", 1, "USDT")['end_asset_n'];

    // How much of the asset will you get if you convert sizing_USD worth of BTC into the asset
    let n_BTC = Loader.best_conversion(exchanges, exchange_names, "BTC", sizing_USD / BTC_price, "MLN")['end_asset_n'];

    // How much of the asset will you get if you convert sizing_USD worth of ETH into the asset
    let n_ETH = Loader.best_conversion(exchanges, exchange_names, "ETH", sizing_USD / ETH_price, "MLN")['end_asset_n'];
    console.log(n_BTC, n_ETH);
}


function log_plays() {
    Arb_Utils.print_exchange_updated_times(exchange_names);

    const sizing_USD = 1000;
    // update_BC_matrix_Data(sizing_USD);

    const successes = find_all_three_step_arbs(sizing_USD, 1.05, false, false);
    for (let play of successes) {
        console.log(play);
    }
    console.log("");
    console.log("Found", successes.length, "plays fitting your criteria");
}

log_plays();
