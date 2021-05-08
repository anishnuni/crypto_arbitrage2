
// returns the unique_plays set with any new assets
// from the given play added to it.
// an asset is considered "new" if 1. it is not already in the unique assets set,
// and 2. the play it is a part of doesn't include any non-base assets that have already
// been included in the unique_assets set
function update_unique_assets(unique_assets, play) {
    const base_assets = ["BTC", "ETH", "USDT", "USDC", "USD", "BUSD"];
    let is_new_play = true;
    for (let asset of play) {
        let is_base_asset = base_assets.includes(asset)
        if ((!is_base_asset) && unique_assets.has(asset)) {
            // not a base asset but unique_assets already has the asset
            is_new_play = false;
            break;
        }
    }
    if (is_new_play) {

    }
    return unique_assets;
}