const Loader = require('./load_data');
const Bittrex_Markets = Loader.load_orderbook("Bittrex");
const WazirX_Markets = Loader.load_orderbook("Wazir");
const CoinDCX_Markets = Loader.load_orderbook("CoinDCX");
const exchange_markets = {"Bittrex": Bittrex_Markets, "WazirX": WazirX_Markets,"CoinDCX": CoinDCX_Markets}

// Find how to acquire the maximum amount of INR on Wazir
// by:
// starting with n USDT on Bittrex, converting it to Asset X on Bittrex
// sending Asset X to Wazir and finally trading asset X for INR
// Not complete
function max_INR(n_USDT) {
    const Wazir_inr_orderbooks = Loader.get_markets(WazirX_Markets, "inr")
    const Bittrex_USDT_orderbooks = Loader.get_markets(Bittrex_Markets, "USDT");
    for (let ticker of Object.keys(Wazir_inr_orderbooks)) {

    }
}


// Finds arbs that work like this:
// Start with start_USDT worth of USDT on Exchange1.
// Then convert that to any asset X on Exchange1.
// Then send asset X over to Exchange2 and sell it for some asset Y
// Then send asset Y back to Exchange1 and sell it for USDT.
// required return = 1.05 means you need a 5% margin
function two_arbs(Exchange1_Markets, Exchange2_Markets, req_return) {
    let successes = [];
    const start_USDT = 1000; // CAN CHANGE
    let Exchange1_USDT_Markets = Loader.get_markets(Exchange1_Markets, "USDT");


    // Loop through all USDT pairs on Exchange1:
    for (let USDT_market of Exchange1_USDT_Markets) {

        try {
            let asset_X = get_asset_2(USDT_market, "USDT");
            let X_n = Loader.conversion(USDT_market, start_USDT, "USDT");
            // console.log(USDT_market, asset_X, X_n);
            let Exchange2_X_Markets = Loader.get_markets(Exchange2_Markets, asset_X);

            // Loop through all asset X pairs on Wazir
            for (let X_market of Exchange2_X_Markets) {
                let asset_Y = get_asset_2(X_market, asset_X);
                let Y_n = Loader.conversion(X_market, X_n, asset_X);
                // console.log(X_market);
                // console.log(asset_X, X_n, asset_Y, Y_n);

                if (asset_Y == "USDT" && (Y_n > start_USDT * req_return)) {
                    successes.push({"X": asset_X, "Y": asset_Y, "Return": Y_n / start_USDT,
                        "X_market1": USDT_market,
                        "X_market2": X_market,
                        "Note": "just sold for USDT directly on Exchange2"});
                }
                // trying to directly get back to USDT with a pair
                let attempt1 = Loader.get_market(Exchange1_Markets, asset_Y, 'USDT');
                if (attempt1 !== "Failed to Find Market") {
                    let end_USDT = Loader.conversion(attempt1, Y_n, asset_Y);
                    if (end_USDT > start_USDT * req_return) {
                        successes.push({"X": asset_X, "Y": asset_Y,
                            "Return": end_USDT / start_USDT,
                            "X_market1": USDT_market,
                            "X_market2": X_market,
                        });
                    }
                }

                let attempt2 = Loader.get_market(Exchange1_Markets, 'USDT', asset_Y);
                if (attempt2 !== "Failed to Find Market") {
                    let end_USDT = Loader.conversion(attempt2, Y_n, asset_Y);
                    if (end_USDT > start_USDT * req_return) {
                        successes.push({"X": asset_X, "Y": asset_Y,
                            "Return": end_USDT / start_USDT,
                            "X_market1": USDT_market,
                            "X_market2": X_market,
                        });
                    }
                }
            }
        } catch {
            console.log("FAiled somewhere along the line");
        }
    }
    return successes;
}


// Given one asset in a market get the second one
function get_asset_2(market, asset_1) {
    if (market['quote'] == asset_1) {
        return market['base'];
    } else {
        return market['quote'];
    }
}


function test() {
    const market = Loader.get_market(Bittrex_Markets,'BTC', 'USDT');
    console.log(market);
    let n_USDT = Loader.conversion(market, 0.1, "BTC");
    console.log("nUSDT", n_USDT)
    console.log("Average Price selling 0.1 BTC", n_USDT / 0.1);
    // let n_BTC = Loader.conversion(market, 500, "USDT")
    // console.log(n_BTC);
    // console.log("Average Price Selling 500 USDT",  n_BTC / 500 );
}

function run_arb2_combos() {
    for (let exchange1_name of Object.keys(exchange_markets)) {
        for (let exchange2_name of Object.keys(exchange_markets)) {
            if (exchange1_name !== exchange2_name) {
                let exchange1 = exchange_markets[exchange1_name];
                let exchange2 = exchange_markets[exchange2_name];
                let successes = two_arbs(exchange1, exchange2, 1.01);
                console.log("Successes for starting with USDT on", exchange1_name, "and then sending assets to", exchange2_name);
                console.log(successes);
                console.log("");
            }
        }
    }
}

run_arb2_combos();