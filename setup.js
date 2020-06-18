(function() {
  const https = require('https');
  const http = require('http');
  const request = require('request');
  const fs = require('fs');

  var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramStr, fillDefaults} = require("./resources/helper");

  module.exports = {

    getClientId: newId,

    getAuthToken(account, password, self, callback) {
      // Define login client info object
      var xAppleIFDClientInfo = {
        "U": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1",
        "L": self.clientSettings.locale,
        "Z": "GMT+02:00",
        "V": "1.1",
        "F": ""
      };
      // Define data object with login info
      var loginData = {
        "accountName": account,
        "password": password,
        "rememberMe": true,
        "trustTokens": []
      };
      request.post("https://idmsa.apple.com/appleauth/auth/signin", {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://idmsa.apple.com/appleauth/auth/signin',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1',
          'Origin': 'https://idmsa.apple.com',
          'X-Apple-Widget-Key': self.clientSettings.xAppleWidgetKey,
          'X-Requested-With': 'XMLHttpRequest',
          'X-Apple-I-FD-Client-Info': JSON.stringify(xAppleIFDClientInfo)
        },
        body: JSON.stringify(loginData)
      }, function(err, response, body) {
        // If there are any request errors
        if (err) return callback(err);
        const result = JSON.parse(body);
        // If the session token exists
        var sessionToken;
        if ("x-apple-session-token" in response.headers) {
          sessionToken = response.headers["x-apple-session-token"];
        }
        var sessionID;
        if ("x-apple-id-session-id" in response.headers) {
          sessionID = response.headers["x-apple-id-session-id"];
        }
        var scnt;
        if ("scnt" in response.headers) {
          scnt = response.headers["scnt"];
        }
        callback(sessionToken ? null : ({
          error: "No session token",
          code: 0
        }), {
          token: sessionToken,
          sessionID: sessionID,
          scnt: scnt,
          response: result
        });
      });
    },
    accountLogin(self, callback = function() {}, trustToken = null, authData = null) {
      return new Promise(function(resolve, reject) {
        request.post("https://setup.icloud.com/setup/ws/1/accountLogin?" + paramStr({
          "clientBuildNumber": self.clientSettings.clientBuildNumber,
          "clientId": self.clientId,
          "clientMasteringNumber": self.clientSettings.clientMasteringNumber
        }), {
          headers: {
            'Content-Type': 'text/plain',
            'Referer': 'https://www.icloud.com/',
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1',
            'Origin': 'https://www.icloud.com'
          },
          body: JSON.stringify(authData || {
            "dsWebAuthToken": self.auth.token,
            "extended_login": true,
            "trustToken": trustToken
          })
        }, function(err, response, body) {
          // If there are any request errors
          if (err) {
            reject(err);
            return callback(err);
          }
          var result = JSON.parse(body);
          // If the login itself was successfully
          if ("success" in result && !result.success) {
            return callback(result.error);
          }
          // Everything is okay. Logged in
          callback(null, result, response);
          resolve({ result, response });
        });
      });
    },
    getApps() {
      return JSON.parse(fs.readFileSync(__dirname + "/resources/apps.json", "utf8"));
    },
    getPushTopics(apps) {
      //return ["73f7bfc9253abaaa423eba9a48e9f187994b7bd9", "5a5fc3a1fea1dfe3770aab71bc46d0aa8a4dad41"];
      return Object.keys(apps).map(appName => apps[appName].pushTopic).filter(topic => topic);
    },
    getPushToken(self, cookiesStr, callback) {
      var tokenData = {
        "pushTopics": self.push.topics,
        "pushTokenTTL": self.push.ttl
      };

      var content = JSON.stringify(tokenData);

      var host = getHostFromWebservice(self.account.webservices.push);

      request.post("https://" + host + "/getToken?" + paramStr({
        "attempt": 1,
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid
      }), {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          'Content-Length': content.length
        }, self.clientSettings.defaultHeaders),
        body: content,
        //gzip: true
      }, function(err, response, body) {
        if (err) return callback(err);
        var result = JSON.parse(body);
        //console.log(result);
        callback(null, result.pushToken, result.webCourierURL, response.headers["set-cookie"]);
      });
    },
    getState(self, callback) {
      var content = JSON.stringify({
        "pushTopics": self.push.topics
      });

      var host = getHostFromWebservice(self.account.webservices.push);

      request.post("https://" + host + "/getState?" + paramStr({
          "clientBuildNumber": self.clientSettings.clientBuildNumber,
          "clientId": self.clientId,
          "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
          "dsid": self.account.dsInfo.dsid,
          "pcsEnabled": true
      }), {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          'Content-Length': content.length
        }, self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {
        if (err) return callback(err);
        var result = JSON.parse(body);
        callback(null, result.states);
      });
    },
    initPush(self, callback) {
      var uri = "https://webcourier.push.apple.com/aps" + "?" + paramStr({
        "tok": self.push.token,
        "ttl": self.push.ttl
      });
      //uri = "https://webcourier.push.apple.com/aps?tok=a819303f3199aa62b6be55a9aa635e29b69defc4a261c01ecf4ab4c9c3fcc9b6&ttl=43200";
      //console.log("\n\n", uri, "\n\n");
      var req = request.get(uri, {
        headers: fillDefaults({}, self.clientSettings.defaultHeaders),
        rejectUnauthorized: false
      }, function(err, response, body) {
        if (err) {
          return callback(err);
        }
        try {
          var result = JSON.parse(body);
        }
        catch (e) {
          callback({
            error: "Failed to parse request body as JSON",
            requestBody: body,
            errorCode: 21
          });
        }
        callback(null, result);
      });
    },
    registerTopics(self, callback = function() {}) {

      const host = getHostFromWebservice(self.account.webservices.push);

      const content = JSON.stringify({
        "pushToken": self.push.token,
        "pushTopics": self.push.topics,
        "pushTokenTTL": self.push.ttl
      });

      const url = "https://" + host + "/registerTopics?" + paramStr({
        "attempt": 1,
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid
      });

      request.post(url, {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies)
        }, self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {

        if (err) return callback(err);

        var result = JSON.parse(body);

        callback(null, result);
      });
    },
    registerPush(self, service, callback) {
      var content = JSON.stringify({
        "apnsToken": self.push.token,
        "clientID": self.clientId,
        "apnsEnvironment": "production"
      });

      var host = getHostFromWebservice(self.account.webservices.ckdeviceservice);

      var url = "https://" + host + "/device/1/" + service + "/production/tokens/register?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid
      });

      request.post(url, {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies)
        }, self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {

        if (err) return callback(err);

        var result = JSON.parse(body);
        callback(null, result);
      });
    },
    __auth(self) {
      const host = "idmsa.apple.com";
      const signInReferer = "https://" + host + "/appleauth/auth/signin?widgetKey=" + self.clientSettings.xAppleWidgetKey + "&locale=" + self.clientSettings.locale + "&font=sf";
      return new Promise(function(resolve, reject) {
        const url = "https://" + host + "/appleauth/auth";

        request.get(url, {
          headers: fillDefaults({
            'Referer': signInReferer,
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'X-Apple-Widget-Key': self.clientSettings.xAppleWidgetKey,
            'X-Apple-I-FD-Client-Info': JSON.stringify(self.clientSettings.xAppleIFDClientInfo),
            'X-Apple-ID-Session-Id': self.clientSettings.xAppleIDSessionId,
            'scnt': self.clientSettings.scnt
          }, self.clientSettings.defaultHeaders),
          //body: content
        }, (err, response, body) => {
          if (err) reject(err);
          resolve({ response, body });
        });
      });
    },
    __securityCode(self, bodyObj = null, method = "POST") {
      const host = "idmsa.apple.com";
      const signInReferer = "https://" + host + "/appleauth/auth/signin?widgetKey=" + self.clientSettings.xAppleWidgetKey + "&locale=" + self.clientSettings.locale + "&font=sf";
      return new Promise(function(resolve, reject) {
        request({
          url: "https://" + host + "/appleauth/auth/verify/trusteddevice/securitycode",
          method: method,
          headers: fillDefaults({
            'Content-Type': 'application/json',
            'Referer': signInReferer,
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'X-Apple-Widget-Key': self.clientSettings.xAppleWidgetKey,
            'X-Apple-I-FD-Client-Info': JSON.stringify(self.clientSettings.xAppleIFDClientInfo),
            'X-Apple-ID-Session-Id': self.clientSettings.xAppleIDSessionId,
            'scnt': self.clientSettings.scnt
          }, self.clientSettings.defaultHeaders),
          body: JSON.stringify(bodyObj)
        }, function(err, response, body) {
          if (err) return reject(err);

          resolve({ response, body });
        });
      });
    },
    __securityPhone(self, mode = "sms") {
      const host = "idmsa.apple.com";
      const signInReferer = "https://" + host + "/appleauth/auth/signin?widgetKey=" + self.clientSettings.xAppleWidgetKey + "&locale=" + self.clientSettings.locale + "&font=sf";
      return new Promise(function(resolve, reject) {
        request({
          url: "https://" + host + "/appleauth/auth/verify/phone",
          method: "PUT",
          headers: fillDefaults({
            'Content-Type': 'application/json',
            'Referer': signInReferer,
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'X-Apple-Widget-Key': self.clientSettings.xAppleWidgetKey,
            'X-Apple-I-FD-Client-Info': JSON.stringify(self.clientSettings.xAppleIFDClientInfo),
            'X-Apple-ID-Session-Id': self.clientSettings.xAppleIDSessionId,
            'scnt': self.clientSettings.scnt
          }, self.clientSettings.defaultHeaders),
          body: JSON.stringify({
            phoneNumber: {
              id: 1
            },
            mode: mode
          })
        }, function(err, response, body) {
          if (err) return reject(err);

          resolve({ response, body });
        });
      });
    },
    trust(self) {
      const host = "idmsa.apple.com";
      const signInReferer = "https://" + host + "/appleauth/auth/signin?widgetKey=" + self.clientSettings.xAppleWidgetKey + "&locale=" + self.clientSettings.locale + "&font=sf";
      return new Promise(function(resolve, reject) {
        request.post("https://" + host + "/appleauth/auth/2sv/trust", {
          headers: fillDefaults({
            'Content-Type': 'application/json',
            'Referer': signInReferer,
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'X-Apple-Widget-Key': self.clientSettings.xAppleWidgetKey,
            'X-Apple-I-FD-Client-Info': JSON.stringify(self.clientSettings.xAppleIFDClientInfo),
            'X-Apple-ID-Session-Id': self.clientSettings.xAppleIDSessionId,
            'scnt': self.clientSettings.scnt
          }, self.clientSettings.defaultHeaders)
        }, function(err, response, body) {
          if (err) return reject(err);

          resolve({ response, body });
        });
      });
    },

    enterSecurityCode(self, code, callback = function() {}) {

      (async () => {
        // General /auth request for current session
        //const auth = await this.__auth(self);

        // Firstly, do a normal /accountLogin
        //const accountLoginResult = await this.accountLogin(self);
        // Parse cookies to objects
        //var cookies = parseCookieStr(accountLoginResult.response.headers["set-cookie"]);
        //self.auth.cookies = fillCookies(self.auth.cookies, cookies);

        // Enter the security code for current session
        const securityCodeResult = await this.__securityCode(self, {
          securityCode: {
            code: code
          }
        });

        // Trust the current device
        const trusting = await this.trust(self);

        // Use /trust's headers (X-Apple-Twosv-Trust-Token and new authentication token)
        if ("x-apple-session-token" in trusting.response.headers) {
          self.auth.token = trusting.response.headers["x-apple-session-token"];
        }
        if ("x-apple-twosv-trust-token" in trusting.response.headers) {
          self.auth.xAppleTwosvTrustToken = trusting.response.headers["x-apple-twosv-trust-token"];
        }

        // Do a complete new /accountLogin
        const lastAccountLoginResult = await this.accountLogin(self, function() {}, self.auth.xAppleTwosvTrustToken);

        // Cookies from this can be used
        var cookies = parseCookieStr(lastAccountLoginResult.response.headers["set-cookie"]);
        self.auth.cookies = fillCookies(self.auth.cookies, cookies);

        self.emit("sessionUpdate");

        callback(true);

      })();
    }
  }

})();
