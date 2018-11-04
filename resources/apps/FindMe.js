const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr} = require("./../helper");

module.exports = {
  initialized: false,
  get(username, password, callback = function() {}) {
    var self = this;

    username = username || self.username;
    password = password || self.password;


    var devicesPromise = new Promise(function(resolve, reject) {
      self.FindMe.__saveGet(username, password, function(err, result) {
        if (err) {
          reject({
            error: "Something went wrong. Maybe your credentials are incorrect.",
            code: 11
          });
          return callback(err);
        }
        resolve(result);
        callback(null, result);
      });
    });

    return devicesPromise;
  },
  __start(callback) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.findme);

    // Define post body

    var content = JSON.stringify({
      "clientContext": {
        "appName": "iCloud Find (Web)",
        "appVersion": "2.0",
        "timezone": "Europe/Rome",
        "inactiveTime": 1905,
        "apiVersion": "3.0",
        "deviceListVersion": 1,
        "fmly": true
      }
    });

    // Post the start up request

    request.post("https://" + host + "/fmipservice/client/web/initClient?" + paramStr({
      "clientBuildNumber": self.clientSettings.clientBuildNumber,
      "clientId": self.clientId,
      "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
      "dsid": self.account.dsInfo.dsid,
    }), {
      headers: {
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }.fillDefaults(self.clientSettings.defaultHeaders),
      body: content
    }, function(err, response, body) {
      if (err) return callback(err);
      try {
        // Try to parse the result as JSON (Sometimes it fails because the cookies invalid)
        var result = JSON.parse(body);
      } catch (e) {
        return callback(e);
      }
      // Parse new cookies from response headers
      var cookies = parseCookieStr(response.headers["set-cookie"]);
      // Update cookies of current session
      self.auth.cookies = fillCookies(self.auth.cookies, cookies);
      // Fire session update event
      self.emit("sessionUpdate");
      // Return the result
      callback(null, result);
    });
  },
  __saveGet(username, password, callback = function() {}) {
    var self = this;

    if (module.exports.initialized) {
      self.FindMe.__data(callback);
    }
    else {
      // Try to load start up data. Start up data is not different to the normal data but it's an "initialization" iCloud.com does and so, we also do it
      self.FindMe.__start(function(err, result) {
        // Doesn't worked. Mostly we need new cookies
        if (err) {
          // Login
          self.login(username, password, function(err) {
            if (err) return callback(err);
            // No error logging in. Let's call get() again.
            self.FindMe.get(username, password, callback);
          });
        }
        else {
          // Start up data was successfully requested. Now, initialized = true and the next data requests will use a differnet endpoint
          module.exports.initialized = true;
          result = handleFindMeData(result);
          callback(null, result);
        }
      });
    }
  },
  __data(callback) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.findme);
    // Define request body for post with own properties
    var content = JSON.stringify({
      "serverContext": {
        "minCallbackIntervalInMS": 1000,
        "enable2FAFamilyActions": false,
        "preferredLanguage": self.clientSettings.language,
        "lastSessionExtensionTime": null,
        "enableMapStats": true,
        "callbackIntervalInMS": 10000,
        "validRegion": true,
        "authToken": null,
        "maxCallbackIntervalInMS": 60000,
        "classicUser": false,
        "isHSA": false,
        "trackInfoCacheDurationInSecs": 86400,
        "imageBaseUrl": "https://statici.icloud.com",
        "minTrackLocThresholdInMts": 100,
        "maxLocatingTime": 90000,
        "sessionLifespan": 900000,
        //"info": "/OwnTkNEhM0l5Ba6TZ73nswixOQpymqAaRWQO7lg8S8YJps5Com2xtj5VZ7rIvnX",
        //"prefsUpdateTime": 1405254598666,
        "useAuthWidget": true,
        "clientId": self.clientId,
        "enable2FAFamilyRemove": false,
        //"serverTimestamp": 1500908149114,
        "macCount": 0,
        "deviceLoadStatus": "200",
        "maxDeviceLoadTime": 60000,
        //"prsId": 181764936,
        "showSllNow": false,
        "cloudUser": true,
        "enable2FAErase": false,
        "id": "server_ctx"
      },
      "clientContext": {
        "appName": "iCloud Find (Web)",
        "appVersion": "2.0",
        "timezone": self.clientSettings.timezone,
        "inactiveTime": 0,
        "apiVersion": "3.0",
        "deviceListVersion": 1,
        "fmly": true
      }
    });

    // Post the request
    request.post("https://" + host + "/fmipservice/client/web/initClient?" + paramStr({
      "clientBuildNumber": self.clientSettings.clientBuildNumber,
      "clientId": self.clientId,
      "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
      "dsid": self.account.dsInfo.dsid,
    }), {
      headers: {
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }.fillDefaults(self.clientSettings.defaultHeaders),
      body: content
    }, function(err, response, body) {
      if (err) return callback(err);
      try {
        // Try to parse the result as JSON (Sometimes it fails because the cookies are invalid)
        var result = JSON.parse(body);
      } catch (e) {

        return callback({
          error: "Request body is no valid JSON",
          errorCode: 13,
          requestBody: body
        });
      }
      // Handle result
      result = handleFindMeData(result);
      // Return result
      callback(null, result);
    });
  }
}

function handleFindMeData(data) {
  return data;
}
