const EventEmitter = require('events');
const fs = require('fs');

const { getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, fillMethods, fillDefaults} = require("./resources/helper");

Array.prototype.indexOfKey = indexOfKey;

class iCloud extends EventEmitter {
  constructor(session = {}, username, password) {
    super();
    var self = this;
    // LoggedIn is false because we can't be sure that the session is valid
    self.loggedIn = false;
    // If the session argument is a string, it will be interpreted as a file path and the file will be read
    if (typeof session === "string") {
      // Set instances's sessionFile key to use it later as path
      self.sessionFile = (" " + session).substring(1);
      // Read the session file
      fs.readFile(session, "utf8", function(err, contents) {
        // If there was no error reading the file, set the session argument to the file's contents
        if (!err) {
          // Set session argument to the contents of the file
          session = JSON.parse(contents);
          // Continue with this session object as base
          sessionInit(session);
        }
        else {
          // If it was not possible to read the file, set the session to an empty object to work with it
          session = {};
          // Continue with the empty session
          sessionInit(session);
        }
      });
    }
    else {
      // The given session argument is actually an object literal, therefore there is no file to be read. Continue :)
      sessionInit(session);
    }

    var currTopics = self.Setup.getPushTopics(self.apps);

    function sessionInit(session) {
      // Session Validation. This adds default properties to the session that doesn't exists
      session = fillDefaults(session, {
        username: username,
        password: password,
        auth: {
          token: null,
          xAppleTwosvTrustToken: null,
          cookies: []
        },
        twoFactorAuthentication: false,
        securityCode: null,
        clientSettings: {
          language: "en-us",
          locale: "en_US",
          xAppleWidgetKey: '83545bf919730e51dbfba24e7e8a78d2',
          get ["xAppleIFDClientInfo"]() {
            return {
              "U": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/603.3.1 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.1",
              "L": session.clientSettings.locale,
              "Z": "GMT+02:00",
              "V": "1.1",
              "F": ""
            };
          },
          timezone: "US/Pacific",
          clientBuildNumber: "17DProject78",
          clientMasteringNumber: "17D68",
          defaultHeaders: {
            'Referer': 'https://www.icloud.com/',
            'Content-Type': 'text/plain',
            'Origin': 'https://www.icloud.com',
            'Host': '',
            'Accept': '*/*',
            'Connection': 'keep-alive',
            get ["Accept-Language"]() {
              return session.clientSettings.language;
            },
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.25 (KHTML, like Gecko) Version/11.0 Safari/604.1.25',
            'Cookie': '',
            'X-Requested-With': "XMLHttpRequest"
          }
        },
        clientId: self.Setup.getClientId(),
        apps: self.apps,
        push: {
          topics: currTopics ? currTopics.filter((topic, index) => currTopics.indexOf(topic) == index) : [],
          token: null,
          ttl: 43200,
          courierUrl: "",
          registered: []
        },
        account: {},
        logins: []
      });

      // Session object is validated. Now, the (self) instance will be extended with session's properties using the fill defaults function.
      self = fillDefaults(self, session);

      Object.keys(self.apps).forEach(function(appPropName) {
        if ("instanceName" in self.apps[appPropName]) {
          var service = require("./" + self.apps[appPropName].modulePath);
          self[self.apps[appPropName].instanceName] = fillMethods({}, service, self);
        }
      });



      // Now, validate the session with checking for important aspects that show that the session can be used to get data (e.g. there need to be a token, some cookies and account info)
      self.loggedIn = (function() {
        //console.log(self.auth.cookies.length > 0, !!self.auth.token, self.account != {}, self.username === username);
        return (self.auth.cookies.length > 0 && self.auth.token && self.account != {} && self.username === username);
      })();

      self.cookiesValid = (function() {
        const timestamp = new Date().getTime();
        // Get list of cookies, represented to a boolean value wether the cookie is expired or no
        const cookiesExpired = self.auth.cookies.map(cookie => new Date(cookie.Expires).getTime() - timestamp < 0);
        // If no cookie is expired, the array contains just 'false' keys
        // Return wether there is no expired cookie (true)
        return cookiesExpired.indexOf(true) === -1;
      })();



      // If the session is valid, the client is ready! Emit the 'ready' event of the (self) instance
      if (self.loggedIn && self.cookiesValid) {
        self.logins.push(new Date().getTime());
        self.emit("ready");
      }
      // If not, the session is invalid: An error event occurs and username and password arguments will be used for logging in and creating a new session
      else {
        self.emit("err", {
          error: "Session is expired or invalid",
          errorCode: 6
        });
        // 'progress' event of login is fired because it's an automatic aspect of the algorithm that it tries to login if the session was invalid
        self.emit("progress", {
          action: "start",
          parentAction: "login",
          progress: 0,
          message: "Trying to reset session and login"
        });

        // Login with username and password
        self.login(self.username, self.password, function(err) {
          if (err) {
            // If an error ocurs, fire an 'error' event
            return self.emit("err", {
              error: "Account is broken or password and username are invalid",
              errorCode: 7
            });
          }
          self.username = username;
          self.password = password;

          self.auth.created = new Date().getTime();
          self.logins.push(self.auth.created);
          // Client is ready
          self.emit("ready");
        });
      }
    }
  }
  set securityCode(code) {
    var self = this;

    self.Setup.enterSecurityCode(self, code, function(result) {
      if (!result) {
        return self.emit("err", {
          message: "Failed to enter security code",
          code: 16
        });
      }
      self.emit("ready");
    });

    self.__securityCode = code;
  }
  get securityCode() {
    return this.__securityCode;
  }
  async sendSecurityCode(mode) {
    if (mode === "sms") {
      const { response, body } = await this.Setup.__securityPhone(this, "sms");
    }
    else if (mode === "voice") {
      const { response, body } = await this.Setup.__securityPhone(this, "voice");
    }
    else {
      const { response, body } = await this.Setup.__securityCode(this, null, "PUT");
    }
  }
  get twoFactorAuthenticationIsRequired() {
    return this.twoFactorAuthentication && !this.auth.xAppleTwosvTrustToken && !this.securityCode;
  }
  // Login method
  login(account, password, callback) {
    var self = this;
    self.Setup.getAuthToken(account, password, self, function(err, authentification) {
      if (err) return callback(err);
      // Got token
      self.auth.token = authentification.token;

      self.clientSettings.xAppleIDSessionId = authentification.sessionID;
      self.clientSettings.scnt = authentification.scnt;
      // If two factor authentification is required
      if (authentification.response.authType === "hsa2") {
        // Set the 'twoFactorAuthentication' property to true to communicate this
        self.twoFactorAuthentication = true;
        self.emit("err", {
          error: "Two-factor-authentication is required.",
          code: 15
        });
      }
      self.emit("progress", {
        parentAction: "login",
        action: "authToken",
        progress: 1 / 3
      });
      self.Setup.accountLogin(self, function(err, result, response) {
        if (err) return callback(err);
        // Logged in
        // Add result to instance
        self.account = result;

        // Parse cookies to objects
        var cookies = parseCookieStr(response.headers["set-cookie"]);
        self.auth.cookies = fillCookies(self.auth.cookies, cookies);
        // Parse cookie objects to a cookie string array and join it to a single string
        var cookiesStr = cookiesToStr(self.auth.cookies);

        // Fire progress event
        self.emit("progress", {
          parentAction: "login",
          action: "accountLogin",
          progress: 2 / 3
        });
        self.loggedIn = true;

        self.Setup.getPushToken(self, cookiesStr, function(err, token, url, cookies) {
          if (err) return callback(err);
          // Got push token.
          self.push.token = token;
          self.push.courierUrl = url;

          self.emit("progress", {
            parentAction: "login",
            action: "pushToken",
            progress: 3 / 3
          });

          callback(null, self);
          self.emit("sessionUpdate");

        });

      });
    });
    //callback(null, "Hey you!");
  }
  registerPushService(service, callback = function() {}) {
    var self = this;
    self.Setup.registerPush(self, service, function(err, result) {
      if (err) {
        return callback(err);
      }
      self.push.registered.push(service);
      self.emit("sessionUpdate");
      callback(null, result);
    });
  }
  initPush(callback = function() {}) {
    var self = this;
    self.Setup.registerTopics(self, function(err, result) {
      if (err) return console.error(err);

      self.push.registered = self.push.registered.concat(result.registeredTopics);


    });

    for (let appName in self.apps) {
      if (self.apps.hasOwnProperty(appName) && self.apps[appName].containerIdentifier) {
        const customPushTopic = self.apps[appName];
        this.registerPushService(customPushTopic.containerIdentifier);
      }
    }

    self.Setup.initPush(self, function(err, result) {
      if (err) {
        self.emit("err", {
          error: "Push token is expired. Getting new one...",
          errorCode: 22
        });
        return self.Setup.getPushToken(self.push.topics, self.push.ttl, self.account.dsInfo.dsid, cookiesToStr(self.auth.cookies), self.clientId, function(err, token, url, cookies) {
          if (err) return callback(err);
          // Got push token.
          self.push.token = token;
          self.push.courierUrl = url;

          //callback(null, self);
          self.initPush(callback);

          self.emit("sessionUpdate");

        });
      }
      // Push request is answered
      self.emit("push", result);
      self.initPush(callback);
    });
  }
  exportSession() {
    // Export session as object
    return {
      username: this.username || null,
      password: this.password || null,
      twoFactorAuthentication: this.twoFactorAuthentication,
      securityCode: this.__securityCode || null,
      auth: this.auth,
      clientId: this.clientId,
      push: this.push,
      account: this.account,
      logins: this.logins,
      clientSettings: this.clientSettings
    }
  }
  saveSession(file = this.sessionFile) {
    // If file argument is not given, try to use the source the session was read from (Only possible if given)
    if (file) {
      fs.writeFile(file, JSON.stringify(this.exportSession(), null, 2), (err) => {
        if (err) return this.emit("error", err);
      });
    }
    else {
      return this.emit("err", {
        error: "File path is invalid",
        errorCode: 12
      })
    }
  }
  get Setup() {
    return require("./setup");
  }
  get apps() {
    return this.Setup.getApps();
  }

}

module.exports = iCloud;