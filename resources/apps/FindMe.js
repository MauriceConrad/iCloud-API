const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, fillDefaults} = require("./../helper");

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
      headers: fillDefaults({
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }, self.clientSettings.defaultHeaders),
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
  __generateContent() {
    return {
      "serverContext": {
        "minCallbackIntervalInMS": 1000,
        "enable2FAFamilyActions": false,
        "preferredLanguage": this.clientSettings.language,
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
        "useAuthWidget": true,
        "clientId": this.clientId,
        "enable2FAFamilyRemove": false,
        "macCount": 0,
        "deviceLoadStatus": "200",
        "maxDeviceLoadTime": 60000,
        "showSllNow": false,
        "cloudUser": true,
        "enable2FAErase": false,
        "id": "server_ctx"
      },
      "clientContext": {
        "appName": "iCloud Find (Web)",
        "appVersion": "2.0",
        "timezone": this.clientSettings.timezone,
        "inactiveTime": 0,
        "apiVersion": "3.0",
        "deviceListVersion": 1,
        "fmly": true
      }
    };
  },
  __data(callback) {
    const self = this;

    var host = getHostFromWebservice(self.account.webservices.findme);
    // Define request body for post with own properties
    var content = JSON.stringify(self.FindMe.__generateContent());

    // Post the request
    request.post("https://" + host + "/fmipservice/client/web/initClient?" + paramStr({
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
  },
  playSound(device, callback = function() {}) {
    const self = this;

    const deviceId = typeof device == "object" ? device.id : device;

    const content = JSON.stringify(Object.assign(self.FindMe.__generateContent(), {
      "device": deviceId,
      "subject": "Reminder \u201eFInd my iPhone\u201c"
    }));

    var host = getHostFromWebservice(this.account.webservices.findme);

    return new Promise(function(resolve, reject) {
      request.post("https://" + host + "/fmipservice/client/web/playSound?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid,
      }), {
        headers: {
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          //'Content-Length': content.length
        }.fillDefaults(self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {
        if (err) return callback(err);

        try {
          // Try to parse the result as JSON (Sometimes it fails because the cookies are invalid)
          var result = JSON.parse(body);
        } catch (e) {
          reject({
            error: "Request body is no valid JSON",
            errorCode: 13,
            requestBody: body
          });
          return callback({
            error: "Request body is no valid JSON",
            errorCode: 13,
            requestBody: body
          });
        }
        if (result) {
          callback(null, result);
          resolve(result);
        }

      });
    });

  }
}

function handleFindMeData(data) {
  return data;
}
