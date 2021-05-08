const fs = require('fs');
const Loader = require('./load_data');

const exchange_markets = Loader.load_all_tradeable_exchanges();
const exchange_names = Object.keys(exchange_markets);
const exchanges = Object.values(exchange_markets);

function write_to_file(filename, data) {
    const file = {"data": data};
    const jsonString = JSON.stringify(file);
    fs.writeFileSync("./Saved_Data/" + filename, jsonString);
}


function get_last_updated_dictionary(exchange_names) {
    let last_updated_times = {};
    for (let exchange of exchange_names) {
        last_updated_times[exchange] = last_updated(exchange);
    }
    return last_updated_times;
}


// return the unix time of the last update to the exchange
function last_updated(exchange) {
    const file = Loader.load_exchange(exchange);
    return file['last_updated'];
}


// finds the last time each of the saved orderbooks has been updated and prints it
function print_exchange_updated_times(exchange_names) {
    const last_updated_dictionary = get_last_updated_dictionary(exchange_names)
    for (let exchange of Object.keys(last_updated_dictionary)) {
        console.log(exchange, "last updated", (new Date(last_updated_dictionary[exchange]*1000).toLocaleString()))
    }
}


// Updates the BC_matrix.json file given the current saved orderbooks
function update_BC_matrix_Data(sizing_USD) {
    const bc_matrix = Loader.get_best_conversion_matrix(exchanges, exchange_names, sizing_USD);
    write_to_file("bc_matrix.json", bc_matrix);
}


// if any of the trades have their start or end asset on the blacklist,
// return true. Otherwise, return false.
function blacklisted(trade, blacklist) {
    const start_asset_blacklisted = blacklist.includes(trade["start_asset"]);
    const end_asset_blacklisted = blacklist.includes(trade["end_asset"]);
    return start_asset_blacklisted || end_asset_blacklisted;
}

// Returns true if deposit works for the exchange and asset_symbol
// or asset file is not found.
function deposit_works(exchange, asset_symbol) {
    let assets = [];
    try {
        assets = Loader.load_exchange_assets(exchange);
    } catch {
        return true;
    }
    let matching_assets = assets.filter((asset) => (asset['symbol'] === asset_symbol));
    for (let asset of matching_assets) {
        if (asset["deposits_active"]) {
            return true;
        }
    }
    return false;
}


// Returns true if withdrawal works for the exchange and asset_symbol
// or asset file is not found.
function withdrawal_works(exchange, asset_symbol) {
    let assets = [];
    try {
        assets = Loader.load_exchange_assets(exchange);
    } catch {
        return true;
    }
    let matching_assets = assets.filter((asset) => (asset['symbol'] === asset_symbol));
    for (let asset of matching_assets) {
        if (asset["withdrawals_active"]) {
            return true;
        }
    }
    return false;
}

// The function will return true if none of hte trades include assets on the blacklist
// And any necessary deposits and withdrawals will work. Otherwise, returns false.
function tradeable(play) {
    const general_blacklist = ["ETHBEAR"];
    const American_Bittrex_blacklist = ["PROS", "YFL", "XYM", "IOTX",
        "QTUM", "IRIS", "TWTR", "TSM", "TSLA", "SQ", "SPY", "AVAX"];
    // Checking that the play doesn't use any blacklisted assets
    for (let trade of play["trades"]) {
        if (blacklisted(trade, general_blacklist)) {
            return false;
        }
        if (trade["exchange"] === "Bittrex") {
            if (blacklisted(trade, ["PROS", "AVAX"])) {
                return false;
            }
        }
        if (trade["end_asset"] === "INR") {
            return false;
        }
    }

    // Checking that the deposits and withdrawals can actually be executed
    for (let i = 0; i < (play["trades"].length - 1); i++) {
        if (play["trades"][i]['exchange'] !== play["trades"][i + 1]['exchange']) {
            if (!withdrawal_works(play["trades"][i]['exchange'], play["trades"][i]['end_asset'])) {
                return false;
            }
            if (!deposit_works(play["trades"][i + 1]['exchange'], play["trades"][i + 1]['start_asset'])) {
                return false;
            }
        }
    }

    if (play["trades"][0]["start_asset"] === "INR") {
        return false;
    }
    return true;
}

module.exports = { write_to_file, last_updated, print_exchange_updated_times, update_BC_matrix_Data, tradeable }