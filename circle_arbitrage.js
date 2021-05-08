const Loader = require('./load_data');
const Arb_Utils = require('./Arb_Utils');

const exchange_markets = Loader.load_all_tradeable_exchanges();
const exchange_names = Object.keys(exchange_markets);
const exchanges = Object.values(exchange_markets);

// File is focused on finding circular arbitrage arbitrage anywhere they may exist.


function log_trades(trades) {
    let to_log = trades[0]["start_asset_n"] + " " + trades[0]["start_asset"];
    for (let trade of trades.slice(1, trades.length)) {
        to_log = to_log + " into " + trade["start_asset_n"] + " " + trade["start_asset"];
    }
    to_log = to_log + " into " + trades[trades.length - 1]["end_asset_n"] + " " + trades[trades.length - 1]["end_asset"];
    console.log(to_log);
}


// ...
function find_all_three_step_arbs(sizing_USD, min_successful_margin, log_all_trades) {
    const bc_matrix = Loader.load_data("bc_matrix.json");
    console.log("Finding Three Step Arbs...");
    const valid_trades = Arb_Utils.get_valid_trades(bc_matrix);

    // all assets that can be traded at the given sizing_USD:
    const tradeable_assets = Object.keys(valid_trades).filter(asset => (valid_trades[asset].length > 0));
    let successes = []

    for (let start_asset of ["USDT"]) {
        try {
            let start_asset_start_n = Loader.get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, start_asset);
            // list of possible asset2s (only possible if it can be converted back into start_asset)
            let asset2_list = valid_trades[start_asset];

            for (let asset2 of asset2_list) {
                let trade1 = Loader.best_conversion(exchanges, exchange_names, start_asset, start_asset_start_n, asset2);
                let asset2_n = trade1["end_asset_n"];

                let asset3_list = valid_trades[asset2].filter(asset => (valid_trades[asset].includes(start_asset)));

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
function find_all_four_step_arbs(sizing_USD, min_successful_margin, log_all_trades) {
    const bc_matrix = Loader.load_data("bc_matrix.json");
    console.log("Finding Four Step Arbs...");
    const valid_trades = Arb_Utils.get_valid_trades(bc_matrix);

    // all assets that can be traded at the given sizing_USD:
    const tradeable_assets = Object.keys(valid_trades).filter(asset => (valid_trades[asset].length > 0));
    let successes = []

    for (let start_asset of ["USDT"]) {
        try {
            let start_asset_start_n = Loader.get_n_asset_from_USD_value(exchanges, exchange_names, sizing_USD, start_asset);
            // list of possible asset2s (only possible if it can be converted back into start_asset)
            let asset2_list = valid_trades[start_asset];

            for (let asset2 of asset2_list) {
                let trade1 = Loader.best_conversion(exchanges, exchange_names, start_asset, start_asset_start_n, asset2);
                let asset2_n = trade1["end_asset_n"];

                let asset3_list = valid_trades[asset2];
                for (let asset3 of asset3_list) {
                    let trade2 = Loader.best_conversion(exchanges, exchange_names, asset2, asset2_n, asset3);
                    let asset3_n = trade2["end_asset_n"];

                    let asset4_list = valid_trades[asset3].filter(asset => (valid_trades[asset].includes(start_asset)));
                    for (let asset4 of asset4_list) {
                        let trade3 = Loader.best_conversion(exchanges, exchange_names, asset3, asset3_n, asset4);
                        let asset4_n = trade3["end_asset_n"];

                        let trade4 = Loader.best_conversion(exchanges, exchange_names, asset4, asset4_n, start_asset);
                        let start_asset_end_n = trade4["end_asset_n"];
                        let trades = [trade1, trade2, trade3, trade4];

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


// max_length can only be 3 or 4
async function run_arbs(sizing_USD, min_return, max_length) {
    let successes = [];
    let length_string = "";
    if (max_length === 3) {
        successes = find_all_three_step_arbs(sizing_USD, min_return, false);
        length_string = "three";
    } else if (max_length === 4) {
        successes = find_all_four_step_arbs(sizing_USD, min_return,  false);
        length_string = "four";
    } else {
        throw Error("Invalid Max Length");
    }
    let tradeable_success = [];
    for (let play of successes) {
        if (Arb_Utils.tradeable(play)) {
            tradeable_success.push(play);
        }
    }

    console.log("");
    console.log("Found", tradeable_success.length, length_string, "step arbs fitting your criteria");

    const params = {"sizing_USD": sizing_USD, "min_successful_margin": min_return};
    const to_file = {"params": params, "successes": successes, "tradeable_successes": tradeable_success};
    const filename = Date.now().toString() + "_" + length_string + "_successes.json";
    Arb_Utils.write_to_file("Plays/" + filename, to_file);
}


function log_plays() {
    const sizing_USD = 1000;
    const min_return = 1.03;

    Arb_Utils.print_exchange_updated_times(exchange_names);

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });


    readline.question('Do you want to update_BC_matrix_Data? Type 1 for yes and 0 for no: ', res => {
        if (res == "1") {
            Arb_Utils.update_BC_matrix_Data(sizing_USD);
        }
        const successes = find_all_four_step_arbs(sizing_USD, min_return,  false);
        let tradeable_success = [];
        let unique_assets = new Set();
        for (let play of successes) {
            if (Arb_Utils.tradeable(play)) {
                console.log(play);
                tradeable_success.push(play);
                unique_assets = update_unique_assets(unique_assets, play)
            }
        }

        console.log("");
        console.log("Found", tradeable_success.length, "plays fitting your criteria");

        const params = {"sizing_USD": sizing_USD, "min_successful_margin": min_successful_margin};
        const to_file = {"params": params, "successes": successes, "tradeable_successes": tradeable_success};
        const filename = Date.now().toString() + "_success_trades.json";
        Arb_Utils.write_to_file(filename, to_file);
    });
}

module.exports = { run_arbs }