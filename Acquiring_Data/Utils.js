const axios = require('axios');
const fs = require('fs');
const current_unix = Math.floor(Date.now() / 1000);

// Return Saved_Data from get request to root+path
async function get(root, path) {
    const response = await axios.get(root + path);
    return response['data'];
}


function log_exchange_progress(percent, exchange_name) {
    if (((Math.round(percent*100) % 10) === 0)) {
        let percent_done = ((100 * percent).toFixed(3));
        console.log(percent_done.toString() + "%", "done with", exchange_name, "Data");
    }
}

// order bids highest rate first to lowest rate last
function get_ordered_bids(bids) {
    return bids.sort(function(bid1, bid2) {return bid2['rate'] - bid1['rate']});
}


// order asks lowest rate first to highest rate last
function get_ordered_asks(asks) {
    return asks.sort(function(ask1, ask2) {return ask1['rate'] - ask2['rate']});
}

// write to a file in the Saved_Data folder
function write_to_file(filename, data) {
    const file = {"last_updated": current_unix, "data": data};
    const jsonString = JSON.stringify(file);
    fs.writeFileSync("./Saved_Data/" + filename, jsonString);
}


function set_union(set1, set2) {
    let union = set1;
    for (let val of set2) {
        union.add(val);
    }
    return union;
}


function last_updated_orderbooks(exchange_name) {
    try {
        const path = "./Saved_Data/" + exchange_name + "/" + exchange_name + "_Orderbooks.json";
        const file = JSON.parse(fs.readFileSync(path));
        return file['last_updated'];
    } catch {
        return 0;
    }
}


function last_updated_assets(exchange_name) {
    try {
        const path = "./Saved_Data/" + exchange_name + "/" + exchange_name + "_Assets.json";
        const file = JSON.parse(fs.readFileSync(path));
        return file['last_updated'];
    } catch {
        return 0;
    }
}


// returns true if the exchange_name's orderbook has been updated
// within the last 10 minutes
function recently_updated_orderbooks(exchange_name) {
    let current_unix = Math.floor(Date.now() / 1000);
    return last_updated_orderbooks(exchange_name) > (current_unix - 600)
}

// returns true if the exchange_name assets has been updated
// within the last 10 minutes
function recently_updated_assets(exchange_name) {
    let current_unix = Math.floor(Date.now() / 1000);
    return last_updated_assets(exchange_name) > (current_unix - 600)
}


function log_completed_orderbooks(exchange_name) {
    const orderbooks_last_updated_unix = last_updated_orderbooks(exchange_name);
    const orderbooks_last_updated_string = (new Date(orderbooks_last_updated_unix * 1000).toLocaleString());
    console.log("");
    console.log(exchange_name + " Orderbooks Done. Updated at", orderbooks_last_updated_string);
    console.log("");
}


function log_completed_assets(exchange_name) {
    const assets_last_updated_unix = last_updated_assets(exchange_name);
    const assets_last_updated_string = (new Date(assets_last_updated_unix * 1000).toLocaleString());
    console.log("");
    console.log(exchange_name + " Assets Done. Updated at", assets_last_updated_string);
    console.log("");
}

module.exports = {log_completed_orderbooks, log_completed_assets, last_updated_assets, last_updated_orderbooks, recently_updated_assets, recently_updated_orderbooks, get, get_ordered_bids, get_ordered_asks, write_to_file, set_union, log_exchange_progress }