const Loader = require('./load_data');
const Arb_Utils = require('./Arb_Utils');

const exchange_markets = Loader.load_all_tradeable_exchanges(); // TODO: does not include Binance currently
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
    for (let asset of known_assets) {
        // all exchange rates for asset:
        let asset_exchanges = bc_matrix[asset];
        // all assets that asset can be exchanged to with an exchange rate > 0
        let exchangeable_to = Object.keys(asset_exchanges).filter(asset2 => (asset_exchanges[asset2] > 0));
        valid_trades[asset] = exchangeable_to;
    }
    return valid_trades;
}


// Currently only looks for two trade arbs.
function find_all_circle_arbs(max_length, sizing_USD, min_successful_margin, log_BC_matrix_progress, log_all_trades) {
    const bc_matrix = Loader.load_data("bc_matrix.json");
    console.log("Finding Arbs...");
    const valid_trades = get_valid_trades(bc_matrix);

    // all assets that can be traded at the given sizing_USD:
    const tradeable_assets = Object.keys(valid_trades).filter(asset => (valid_trades[asset].length > 0));
    let successes = []

    for (let asset1 of tradeable_assets) {
        try {
            let asset1_start_n = Loader.get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, asset1);
            // list of possible asset2s (only possible if it can be converted back into start_asset)
            let asset2_list = valid_trades[asset1].filter(asset2 => (valid_trades[asset2].includes(asset1)))
            for (let asset2 of asset2_list) {
                let trade1 = Loader.best_conversion(exchanges, exchange_names, asset1, asset1_start_n, asset2);
                let asset2_n = trade1["asset2_n"];

                let trade2 = Loader.best_conversion(exchanges, exchange_names, asset2, asset2_n, asset1);
                let asset1_end_n = trade2["asset2_n"];
                if (log_all_trades) {
                    console.log(asset1_start_n, asset1, "into", asset2_n, asset2, "into", asset1_end_n, asset1);
                }
                let margin = trade2["asset2_n"] / trade1["asset1_n"];
                if (margin > min_successful_margin) {
                    let play = {"play_stats": {"margin": margin}, "trades": [trade1, trade2]}
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
    const BTC_price = Loader.best_conversion(exchanges, exchange_names, "BTC", 0.5, "USDT")['asset2_n'] / 0.5;
    const ETH_price = Loader.best_conversion(exchanges, exchange_names, "ETH", 1, "USDT")['asset2_n'];

    // How much of the asset will you get if you convert sizing_USD worth of BTC into the asset
    let n_BTC = Loader.best_conversion(exchanges, exchange_names, "BTC", sizing_USD / BTC_price, "MLN")['asset2_n'];

    // How much of the asset will you get if you convert sizing_USD worth of ETH into the asset
    let n_ETH = Loader.best_conversion(exchanges, exchange_names, "ETH", sizing_USD / ETH_price, "MLN")['asset2_n'];
    console.log(n_BTC, n_ETH);
}


function log_plays() {
    Arb_Utils.print_exchange_updated_times(exchange_names);

    const sizing_USD = 5000;
    // update_BC_matrix_Data(sizing_USD);
    const successes = find_all_circle_arbs(2, sizing_USD, 1.05, false, false);
    for (let play of successes) {
        console.log(play);
    }
    console.log("");
    console.log("Found", successes.length, "plays fitting your criteria")
}

log_plays();
