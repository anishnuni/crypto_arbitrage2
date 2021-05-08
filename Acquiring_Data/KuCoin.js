const Utils = require('./Utils');
const KuCoin_root = "https://api.kucoin.com/v3";

// get base and quote asset from the KuCoin ticker name
function kucoin_get_assets(ticker) {
    let l = ticker.split("-");
    return {"base": (l[0]).toUpperCase(), "quote": (l[1]).toUpperCase()};
}


async function update_kucoin_data() {
    while (!Utils.recently_updated_orderbooks("KuCoin")) {
        try {
            await update_KuCoin_orderbooks();
        } catch {
            console.log("Errored while trying to call KuCoin Orderbooks API. Trying Again...")
        }
    }
    Utils.log_completed_orderbooks("KuCoin");
    while (!Utils.recently_updated_assets("KuCoin")) {
        try {
            await update_KuCoin_assets();
        } catch {
            console.log("Errored while trying to call KuCoin Assets API. Trying Again...")
        }
    }
    Utils.log_completed_assets("KuCoin");
}


// gets the orderbook of every KuCoin market and saves it to a file in the Saved_Data folder.
async function update_KuCoin_orderbooks() {
    //TODO: pass

}

// save the current status of all the KuCoin Assets
async function  update_KuCoin_assets() {

}


function get_network(coin_type) {
    if (coin_type == "ETH_CONTRACT") {
        return "ETH";
    } else if (coin_type == "STELLAR") {
        return "XLM";
    } else {
        return "UNKNOWN";
    }
}

module.exports = { update_kucoin_data, kucoin_get_assets }