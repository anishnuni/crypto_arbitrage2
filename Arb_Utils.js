const fs = require('fs');
const Load_Data = require('./load_data');

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
    const file = Load_Data.load_exchange(exchange);
    return file['last_updated'];
}


function print_exchange_updated_times(exchange_names) {
    const last_updated_dictionary = get_last_updated_dictionary(exchange_names)
    for (let exchange of Object.keys(last_updated_dictionary)) {
        console.log(exchange, "last updated", (new Date(last_updated_dictionary[exchange]*1000).toLocaleString()))
    }
}

module.exports = { write_to_file, print_exchange_updated_times }