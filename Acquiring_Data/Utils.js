const axios = require('axios');
const fs = require('fs');
const current_unix = Math.floor(Date.now() / 1000);

// Return Saved_Data from get request to root+path
async function get(root, path) {
    const response = await axios.get(root + path);
    return response['data'];
}


function log_exchange_progress(percent, exchange_name) {
    if (((Math.round(percent*100) % 10) === 0) || ((Math.round(percent*100) % 10) === 5)) {
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
function write_to_file(filename, data, log_finished_exchange) {
    const file = {"last_updated": current_unix, "data": data};
    const jsonString = JSON.stringify(file);
    fs.writeFileSync("./Saved_Data/" + filename, jsonString);
    if (log_finished_exchange) {
        console.log("");
        console.log("Finished", filename);
        console.log("");
    }
}


function set_union(set1, set2) {
    let union = set1;
    for (let val of set2) {
        union.add(val);
    }
    return union;
}

module.exports = { get, get_ordered_bids, get_ordered_asks, write_to_file, set_union, log_exchange_progress }