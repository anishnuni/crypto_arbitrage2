const cron = require("node-cron");
const Arb_Utils = require('./Arb_Utils');
const Updater = require("./update_data");
const Arbitrage = require("./circle_arbitrage");

var cronjobs = cron.schedule("*/10 * * * *", async function() {
    const sizing_USD = 1000;
    const min_return = 1.03;

    console.log("");
    console.log("Starting a new run of Cronjob at", (new Date()).toDateString(), (new Date()).toLocaleTimeString())
    console.log("");

    // get latest data from all the exchanges:
    await Updater.update_all();

    // create a new BC_matrix based on the latest exchange data:
    await Arb_Utils.update_BC_matrix_Data(sizing_USD);

    // find all three step arbs and save them to file:
    await Arbitrage.run_arbs(sizing_USD, min_return, 3);

    // find all four step arbs and save them to file:
    await Arbitrage.run_arbs(sizing_USD, min_return, 4);
});

cronjobs.start();
