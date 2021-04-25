const ccxt = require('ccxt');
const Utils = require('./Utils');
const CoinDCX = require('./CoinDCX');
const Bittrex = require('./Bittrex');
const Bittrex_root = "https://api.bittrex.com/v3";

const binance = new ccxt.binance({'enableRateLimit': true});

async function get_Binance_assets() {
    let assets = new Set();
    let responses = await binance.fetchMarkets();
    for (let response of responses) {
        assets.add(response['base']);
        assets.add(response['quote']);
    }
    return assets;
}


async function get_Coin_DCX_assets() {
    let assets = new Set();
    const markets = await Utils.get("https://api.coindcx.com", "/exchange/v1/markets_details");
    const tickers = markets.map(market => market['pair']);
    for (let ticker of tickers) {
        let pair = CoinDCX.coindcx_get_assets(ticker);
        assets.add(pair['quote']);
        assets.add(pair['base']);
    }
    return assets;
}


async function get_Bittrex_assets() {
    let assets = new Set();
    const markets = await Utils.get(Bittrex_root, "/markets/tickers");
    const tickers = markets.map(market => market['symbol']);
    for (let ticker of tickers) {
        let pair = Bittrex.bittrex_get_assets(ticker);
        assets.add(pair['quote']);
        assets.add(pair['base']);
    }
    return assets;
}


async function update_Known_Assets_Data() {
    let gets = [];
    gets.push(get_Binance_assets());
    gets.push(get_Coin_DCX_assets());
    gets.push(get_Bittrex_assets());
    const known_assets = await Promise.all(gets).then((exchange_assets) => {
        let known_assets = new Set();
        for (let assets of exchange_assets) {
            known_assets = Utils.set_union(known_assets, assets);
        }
        return Array.from(known_assets);
    });
    Utils.write_to_file("Known_Assets.json", known_assets)
}



module.exports = { update_Known_Assets_Data }