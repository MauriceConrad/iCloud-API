const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, indexOfKey, paramStr, fillDefaults} = require("./../helper");



module.exports = {
  getLocations(callback = function() {}) {
    var self = this;
    var time = new Date().getTime();
    var randomTime = time => Math.round(time + (Math.random() * 20000 - 10000));
    var content = {
      "dataContext": {
        "0": randomTime(time),
        "1": randomTime(time),
        "2": randomTime(time),
        "5": randomTime(time),
        "6": randomTime(time),
        "8": randomTime(time),
        "9": "",
        "10": randomTime(time),
        "11": randomTime(time),
        "12": randomTime(time),
        "13": randomTime(time),
        "18": randomTime(time),
        "19": randomTime(time),
        "20": randomTime(time),
        "21": randomTime(time),
        "22": randomTime(time)
      },
      "serverContext": {
        "minCallbackIntervalInMS": 5000,
        "res": null,
        "clientId": "",
        "showAirDropImportViewOniCloudAlert": true,
        "authToken": null,
        "maxCallbackIntervalInMS": 10000,
        "prsId": 181764936,
        "callbackTimeoutIntervalInMS": 0,
        "heartbeatIntervalInSec": 543600,
        "transientDataContext": {
          "0": 0,
          "1": 0,
          "2": 1,
          "3": 1,
          "4": time
        },
        "sendMyLocation": true,
        "notificationToken": null,
        "iterationNumber": 0
      },
      "clientContext": {
        "productType": "fmfWeb",
        "appVersion": "1.0",
        "contextApp": "com.icloud.web.fmf",
        "userInactivityTimeInMS": 0,
        "windowInFocus": false,
        "windowVisible": true,
        "mapkitAvailable": true,
        "tileServer":"Apple"
      }
    };
    content = JSON.stringify(content);

    var host = getHostFromWebservice(self.account.webservices.fmf);

    var requestPromise = new Promise(function(resolve, reject) {
      request.post("https://" + host + "/fmipservice/client/fmfWeb/refreshClient?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid,
      }), {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          'Content-Length': content.length
        }, self.clientSettings.defaultHeaders),
        body: content,
        //gzip: true
      }, function(err, response, body) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var result = JSON.parse(body);

        var cookies = parseCookieStr(response.headers["set-cookie"]);
		  self.auth.cookies = fillCookies(self.auth.cookies, cookies);
		  
		  var locations = [];

        if ("locations" in result) {
          locations = result.locations.map(function(pos) {
            if (pos.location == null) return {};
            return {
              person: {
                info: result.following[result.following.indexOfKey(pos.id, "id")] || null,
                contact: result.contactDetails[result.contactDetails.indexOfKey(pos.id, "id")] || null
              },
              address: pos.location.address,
              accuracy: pos.location.horizontalAccuracy,
              timestamp: pos.location.timestamp,
              longitude: pos.location.longitude,
              latitude: pos.location.latitude
            };
          });
		  }
		  
        resolve(locations);
        callback(null, locations);
      });
    });

    return requestPromise;
  }
}
