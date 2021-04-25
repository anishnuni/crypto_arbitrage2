const Utils = require('./Utils');
const Bittrex_root = "https://api.bittrex.com/v3";

// get base and quote asset from the Bittrex ticker name
function bittrex_get_assets(ticker) {
    let l = ticker.split("-");
    return {"base": (l[0]).toUpperCase(), "quote": (l[1]).toUpperCase()};
}


async function update_bittrex_data() {
    update_Bittrex_orderbooks();
    update_Bittrex_assets();
}


// gets the orderbook of every Bittrex market and saves it to a file in the Saved_Data folder.
async function update_Bittrex_orderbooks() {
    const markets = await Utils.get(Bittrex_root, "/markets");
    const tradeable_markets = markets.filter((market) => (market["status"] === "ONLINE"));

    let orderbooks = [];
    let i = 0;
    for (let market of tradeable_markets) {
        let response = await Utils.get(Bittrex_root, "/markets/" + market["symbol"] + "/orderbook");
        let to_save = {"base": market["baseCurrencySymbol"], "quote": market["quoteCurrencySymbol"]};

        let bids = [];
        let asks = [];

        for (let bid of response['bid']) {
            bids.push({"quantity": parseFloat(bid['quantity']), "rate": parseFloat(bid['rate'])})
        }
        for (let ask of response['ask']) {
            asks.push({"quantity": parseFloat(ask['quantity']), "rate": parseFloat(ask['rate'])})
        }

        to_save['bids'] = Utils.get_ordered_bids(bids);
        to_save['asks'] = Utils.get_ordered_asks(asks);
        orderbooks.push(to_save);

        i++;
        Utils.log_exchange_progress(i / tradeable_markets.length, "Bittrex");
    }
    Utils.write_to_file("Bittrex_Orderbooks.json", orderbooks, true);
}


async function update_Bittrex_assets() {
    const assets = await Utils.get(Bittrex_root, "/currencies");
    let asset_data = [];
    for (let asset of assets) {
        let to_save = {};
        if (asset["notice"] === "")  {
            to_save = {"symbol": asset["symbol"], "deposits_active": true, "withdrawals_active": true};
        } else {
            if (asset["notice"].includes("Deposits and withdrawals are temporarily offline.")) {
                to_save = {"symbol": asset["symbol"], "deposits_active": false, "withdrawals_active": false};
            } else {
                if (asset["status"] === "ONLINE") {
                    to_save = {"symbol": asset["symbol"], "deposits_active": true, "withdrawals_active": true};
                }
            }
        }
        asset_data.push(to_save);
    }
    Utils.write_to_file("Bittrex_Assets.json", asset_data, true)
}


module.exports = { update_bittrex_data, bittrex_get_assets }