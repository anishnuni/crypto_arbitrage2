const axios = require('axios');
const fs = require('fs');
const current_unix = Math.floor(Date.now() / 1000);

// Return Saved_Data from get request to root+path
async function get(root, path) {
    const response = await axios.get(root + path);
    return response['data'];
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
    fs.writeFileSync("../Saved_Data/" + filename, jsonString);
}

module.exports = { get, get_ordered_bids, get_ordered_asks, write_to_file }