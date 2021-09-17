import config from "../config.js";

/**
 * Check if the Module Settings Collection exists
 * @param {API} api Directus API
 * @param {Function} callback Callback function(exists)
 */
function collectionExists(api, callback) {
    api.get(`/collections/${config.collection.collection}`).then(function(res) {
        return callback(res.data && res.data.data);
    }).catch(function(err) {
        console.log(err);
        return callback(false);
    });
}

/**
 * Create the Module Settings Collection and Fields
 * @param {API} api Directus API
 * @param {Function} callback Callback function(success)
 */
function createCollection(api, callback) {
    api.post('/collections', config.collection).then(async function(res) {
        if ( res && res.status && res.status === 200 ) {
            let requests = [];
            for ( let i = 0; i < config.fields.length; i++ ) {
                requests.push(api.post(`/fields/${config.collection.collection}`, config.fields[i]));
            }
            const responses = await Promise.all(requests);
            for ( let i = 0; i < responses.length; i++ ) {
                if ( responses[i].status !== 200 ) {
                    return callback(false);
                }
            }
            return callback(true);
        }
        else {
            return callback(false);
        }
    }).catch(function(err) {
        console.log(err);
        return callback(false);
    });
}

/**
 * Get the Sites and their properties
 * @param {API} api Directus API
 * @param {Function} callback Callback function(sites)
 */
function getSites(api, callback) {
    api.get(`/items/${config.collection.collection}`).then(function(res) {
        if ( res && res.data && res.data.data ) {
            let sites = [];
            let so = {};
            for ( let i = 0; i < res.data.data.length; i++ ) {
                let s = res.data.data[i];
                let k = "site_" + s.site;
                let o = so[k] ? so[k] : {'site-id': s.site};
                o[s.key] = s.value;
                so[k] = o;
            }
            for (const k in so) {
                if (so.hasOwnProperty(k)) {
                    sites.push(so[k]);
                }
            } 
            return callback(sites);
        }
        return callback();
    }).catch(function(err) {
        console.log(err);
        return callback();
    });
}

/**
 * 
 * @param {API} api Directus API
 * @param {String} name Site Name
 * @param {String} path Site Path
 * @param {String} command Site Build Command
 * @param {String} url Site URL
 * @param {Function} callback Callback function(success)
 */
function saveSite(api, name, path, command, url, callback) {
    _getNewSiteId(api, function(site_id) {
        if ( !site_id ) return callback(false);
        let properties = [
            {
                "site": site_id,
                "key": config.keys.name,
                "value": name
            },
            {
                "site": site_id,
                "key": config.keys.path,
                "value": path
            },
            {
                "site": site_id,
                "key": config.keys.command,
                "value": command
            },
            {
                "site": site_id,
                "key": config.keys.url,
                "value": url,
            },
            {
                "site": site_id,
                "key": config.keys.timestamp,
                "value": undefined
            },
            {
                "site": site_id,
                "key": config.keys.activity,
                "value": 0
            }
        ];
        api.post(`/items/${config.collection.collection}`, properties).then(function(res) {
            return callback(res && res.status && res.status === 200);
        }).catch(function (err) {
            console.log(err);
            return callback(false);
        });
    });
}

/**
 * Get the ID of the last Activity Item (excluding authenticate)
 * @param {API} api Directus API
 * @param {Function} calback Callback function(activity_id)
 */
function getLastActivityId(api, callback) {
    let filter = JSON.stringify(config.activityFilter);
    api.get(`/activity?filter=${filter}&sort=-timestamp&limit=1`).then(function(res) {
        return callback(res && res.data && res.data.data && res.data.data.length > 0 ? res.data.data[0].id : 0);
    }).catch(function(err) {
        console.log(err);
        return callback();
    });
}

/**
 * Get the next available Site ID
 * @param {API} api Directus API
 * @param {Function} callback Callback function(site_id)
 */
function _getNewSiteId(api, callback) {
    api.get(`/items/${config.collection.collection}?sort=-site&limit=1`).then(function(res) {
        return callback(res && res.data && res.data.data && res.data.data.length > 0 ? res.data.data[0].site+1 : 1);
    }).catch(function(err) {
        console.log(err);
        return callback();
    });
}

export { collectionExists, createCollection, getSites, saveSite, getLastActivityId };