const axios = require('axios');
const url = require('url');
const crypto = require('crypto');
const Utils = require('./Utils');
const Config = require('../config.json');


function signature(query_string) {
    return crypto
        .createHmac('sha256', binance_api_secret)
        .update(query_string)
        .digest('hex');
}

const binance_api_root = "https://api.binance.com";
const binance_api_key = Config["Binance NoTrade API"]['key'];
const binance_api_secret = Config["Binance NoTrade API"]['secret'];

// Uses Binance API and loops through
// Took 6 minutes and 17 seconds on Sunday April 25th 3:30 am
async function update_binance_data() {
    update_Binance_orderbooks();
    update_Binance_assets();
}


async function update_Binance_orderbooks() {
    const exchangeInfo = await Utils.get(binance_api_root, "/api/v3/exchangeInfo");

    const tradeable_markets = exchangeInfo["symbols"].filter((market) => (market["status"] === "TRADING"));
    const tradeable_tickers = tradeable_markets.map((market) =>
        ({"quote": market["quoteAsset"].toUpperCase(),
            "base": market["baseAsset"].toUpperCase()
        }));

    let orderbooks = [];
    let i = 0;
    for (let ticker of tradeable_tickers) {
        let market = ticker;
        try {
            let orderbook = await Utils.get(binance_api_root, "/api/v3/depth?symbol=" + market['base'] + market['quote']);
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
            console.log("Failed on get", binance_api_root, "/api/v3/depth?symbol=" + market['base'] + market['quote']);
        }
        i++;
        Utils.log_exchange_progress(i / tradeable_markets.length, "Binance");
    }
    Utils.write_to_file("Binance/Binance_Orderbooks.json", orderbooks, true);
}


async function update_Binance_assets() {
    const current_unix = Math.floor(Date.now());
    const hashed_params = signature("timestamp=" + String(current_unix));
    let payload = { timestamp: current_unix , signature: hashed_params};

    const params = new url.URLSearchParams(payload);
    const options = {
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
            'X-MBX-APIKEY': binance_api_key
        }
    };
    const assets = (await axios.get(`https://api.binance.com/sapi/v1/capital/config/getall?${params}`, options))['data'];

    let asset_data = [];
    for (let asset of assets) {
        const asset_networklist = asset["networkList"];
        for (let network_asset of asset_networklist) {
            let to_save = {"symbol": network_asset["coin"], "network": network_asset["network"], "deposits_active": network_asset["depositEnable"], "withdrawals_active": network_asset["withdrawEnable"]};
            asset_data.push(to_save);
        }
    }
    Utils.write_to_file("Binance/Binance_Assets.json", asset_data, true);
}


module.exports = { update_binance_data }