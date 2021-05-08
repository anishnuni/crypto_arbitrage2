const Utils = require('./Utils');
const Wazir_root = "https://api.wazirx.com/api/v2";


async function update_wazirx_data() {
    while (!Utils.recently_updated_orderbooks("WazirX")) {
        try {
            await update_WazirX_orderbooks();
        } catch {
            console.log("Errored while trying to call WazirX Orderbooks API. Trying Again...")
        }
    }
    Utils.log_completed_orderbooks("WazirX");
    // while (!Utils.recently_updated_assets("WazirX")) {
    //     try {
    //         await update_WazirX_assets();
    //     } catch {
    //         console.log("Errored while trying to call WazirX Assets API. Trying Again...")
    //     }
    // }
    // Utils.log_completed_assets("WazirX");
}


async function update_WazirX_orderbooks() {
    const Wazir_overview = await Utils.get(Wazir_root, "/market-status");
    const tradeable_markets = Wazir_overview["markets"].filter((market) => (market["status"] === "active"));
    const tradeable_tickers = tradeable_markets.map((market) => (
        {"quote": market["quoteMarket"].toUpperCase(),
            "base": market["baseMarket"].toUpperCase()
        }));
    const Wazir_assets = Wazir_overview["assets"];

    let orderbooks = [];
    let i = 0;
    for (let ticker of tradeable_tickers) {
        try {
            let symbol = ticker['base'] + ticker['quote'];
            let response = await Utils.get(Wazir_root, "/depth?market=" + symbol.toLowerCase());
            let market = ticker;

            let bids = [];
            let asks = [];

            for (let bid of response['bids']) {
                bids.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])})
            }
            for (let bid of response['asks']) {
                asks.push({"quantity": parseFloat(bid[1]), "rate": parseFloat(bid[0])})
            }

            market['bids'] = Utils.get_ordered_bids(bids);
            market['asks'] = Utils.get_ordered_asks(asks);
            orderbooks.push(market);
        } catch {
            console.log("Encountered issue when acquiring a WazirX Market", ticker);
        }
        i++;
        // Utils.log_exchange_progress(i / tradeable_markets.length, "WazirX");
    }
    Utils.write_to_file("WazirX/WazirX_Orderbooks.json", orderbooks, true);
}

module.exports = { update_wazirx_data }