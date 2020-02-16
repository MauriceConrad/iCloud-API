const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, timeArray, arrayTime, fillDefaults} = require("./../helper");


module.exports = {
  getFolders(callback = function() {}) {
    var self = this;
    //var host = getHostFromWebservice(self.account.webservices.mailws);

    return self.Mail.__folder("list", null, callback);
  },
  listMessages(folder, selected = 1, count = 50, callback = function() {}) {
    var self = this;
    var host = "p44-mailws.icloud.com";

    var content = JSON.stringify({
      "jsonrpc": "2.0",
      "id": (new Date().getTime()) + "/1",
      "method": "list",
      "params": {
        "guid": folder.guid,
        "sorttype": "Date",
        "sortorder": "descending",
        "searchtype": null,
        "searchtext": null,
        "requesttype": "index",
        "selected": selected,
        "count": count,
        "rollbackslot": "0.0"
      },
      "userStats": {},
      "systemStats": [0, 0, 0, 0]
    });

    var listPromise = new Promise(function(resolve, reject) {
      self.Mail.__message(content, function(err, data) {
        if (err) {
          reject(err);
          return callback(err);
        }
        data = {
          meta: data.result.filter(message => message.type === "CoreMail.MessageListMetaData"),
          messages: data.result.filter(message => message.type === "CoreMail.Message")
        };
        if (data.meta.length >= 1) {
          data.meta = data.meta[0];
        }
        resolve(data);
        callback(null, data);
      });
    });


    return listPromise;
  },
  getMessage(mail, callback = function() {}) {
    var self = this;
    var host = "p44-mailws.icloud.com";

    //return console.log(mail);

    var content = JSON.stringify({
      "jsonrpc": "2.0",
      "id": (new Date().getTime()) + "/1",
      "method": "get",
      "params": {
        "guid": mail.guid,
        "parts": mail.parts.map(part => part.guid)
      },
      "userStats": {},
      "systemStats": [0, 0, 0, 0]
    });
    var detailsPromise = new Promise(function(resolve, reject) {
      self.Mail.__message(content, function(err, data) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var mailDetailed = data.result[data.result.indexOfKey("CoreMail.MessageDetail", "recordType")];
        mailDetailed.data = mailDetailed.parts.map(part => part.content).join("");
        delete mailDetailed.parts;
        resolve(mailDetailed);
        callback(null, mailDetailed);
      });
    });

    return detailsPromise;

  },
  move(messages, destination, callback = function() {}) {
    messages = messages instanceof Array ? messages : [messages];
    var self = this;

    var folder = getFolder(messages);
    if (!folder) return callback({
      error: "Messages are not in the same folder",
      errorCode: 21
    });

    var content = JSON.stringify({
      "jsonrpc": "2.0",
      "id": (new Date()) + "/1",
      "method": "move",
      "params": {
        "folder": folder,
        "dest": destination.guid,
        "uids": messages.map(message => message.uid),
        "rollbackslot": "0.0"
      },
      "userStats": {
        "tm": 1,
        "ae": 1
      },
      "systemStats": [0, 0, 0, 0]
    });

    var movePromise = new Promise(function(resolve, reject) {
      self.Mail.__message(content, function(err, data) {
        if (err) {
          reject(err);
          return callback(err);
        }
        resolve(data);
        callback(null, data);
      });
    });

    return movePromise;
  },
  flag(messages, flag = "flagged", callback = function() {}) {
    var self = this;
    return self.Mail.__flag("setflag", flag, messages, callback);
  },
  unflag(messages, flag = "flagged", callback = function() {}) {
    var self = this;
    return self.Mail.__flag("clrflag", flag, messages, callback);
  },
  delete(messages, callback = function() {}) {
    var self = this;
    messages = messages instanceof Array ? messages : [messages];

    var folder = getFolder(messages);
    if (!folder) return callback({
      error: "Messages are not in the same folder",
      errorCode: 21
    });

    var content = JSON.stringify({
      "jsonrpc": "2.0",
      "id": (new Date()) + "/1",
      "method": "delete",
      "params": {
        "folder": folder,
        "uids": messages.map(message => message.uid),
        "rollbackslot": "0.0"
      },
      "userStats": {},
      "systemStats": [0, 0, 0, 0]
    }, null, 2);

    //return console.log(content);

    var deletePromise = new Promise(function(resolve, reject) {
      self.Mail.__message(content, function(err, result) {
        if (err) {
          reject(err);
          return callback(err);
        }
        resolve(result);
        callback(null, result);
      });
    });

    return deletePromise;
  },
  send(message, callback = function() {}) {
    var self = this;


    var sendPromise = new Promise(function(resolve, reject) {

      if (self.Mail.preference) {
        sendMail(self.Mail.preference[1].emails[self.Mail.preference[1].emails.indexOfKey(true, "canSendFrom")].address, self.Mail.preference[1].fullName);
      }
      else if (message.from) {
        sendMail();
      }
      else {
        self.Mail.__preference(function(err, data) {
          self.Mail.preference = data;
          sendMail(self.Mail.preference[1].emails[self.Mail.preference[1].emails.indexOfKey(true, "canSendFrom")].address, self.Mail.preference[1].fullName);
        });
      }
      function sendMail(address, fullName) {
        var from = fullName + "<" + address + ">";
        message = fillDefaults(message, {
          "date": new Date().toString(),
          "to": null,
          "subject": "",
          "body": "",
          "webmailClientBuild": self.clientSettings.clientBuildNumber,
          "attachments": [],
          "draftGuid": null
        });
        message.from = message.from ? message.from : from;
        message.textBody = message.body.replace(/<[^<>]*>/g, "");

        var content = JSON.stringify({
          "jsonrpc": "2.0",
          "id": (new Date().getTime()) + "/1",
          "method": "send",
          "params": message,
          "userStats": {
            "biuc": 1
          },
          "systemStats": [0, 0, 0, 0]
        });
        self.Mail.__message(content, function(err, result) {
          if (err) {
            reject(err);
            return callback(err);
          }
          resolve(result);
          callback(null, result);
        });
      }
    });

    return sendPromise;


  },
  createFolder(folder, callback = function() {}) {
    var self = this;

    var params = fillDefaults(folder, {
      name: null,
      parent: null
    });
    params.parent = (typeof params.parent === "object" && params.parent != null) ? params.parent.guid : params.parent;

    return self.Mail.__folder("put", params, callback);
  },
  renameFolder(folder, name, callback = function() {}) {
    var self = this;
    folder.name = name;

    return self.Mail.__folder("rename", folder, callback);

  },
  moveFolder(folder, target, callback = function() {}) {
    var self = this;
    if (target) folder.parent = target.guid;

    return self.Mail.__folder("move", folder, callback);
  },
  deleteFolder(folder, callback = function() {}) {
    var self = this;
    return self.Mail.__folder("delete", {
      guid: typeof folder === "string" ? folder : folder.guid
    }, callback);
  },
  __flag(method, flag, messages, callback = function() {}) {
    var self = this;

    messages = messages instanceof Array ? messages : [messages];

    var flagPromise = new Promise(function(resolve, reject) {
      var folder = getFolder(messages);
      if (!folder) {
        var errObj = {
          error: "Messages are not in the same folder",
          errorCode: 21
        };
        reject(errObj);
        return callback(errObj);
      }
      var content = JSON.stringify({
        "jsonrpc": "2.0",
        "id": (new Date().getTime()) + "/1",
        "method": method,
        "params": {
          "folder": folder,
          "uids": messages.map(message => message.uid),
          "flag": flag,
          "rollbackslot": "0.0"
        },
        "userStats": {},
        "systemStats": [0, 0, 0, 0]
      });

      self.Mail.__message(content, function(err, data) {
        if (err) {
          reject(err);
          return callback(err);
        }
        resolve(data);
        callback(null, data);
      });
    });

    return flagPromise;
  },
  __message(content, callback = function() {}) {
    var self = this;
    var host = "p44-mailws.icloud.com";

    request.post("https://" + host + "/wm/message?" + paramStr({
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
      body: content
    }, function(err, response, body) {
      if (err) return callback(err);
      var data = handleAuthFail(body, response, self);
      if (data) {
        callback(null, data);
      }
      else {
        self.Mail.__message(content, callback)
      }
    });
  },
  __folder(method, params, callback = function() {}) {
    var self = this;
    var host = "p44-mailws.icloud.com";



    var content = {
      "jsonrpc": "2.0",
      "id": (new Date().getTime()) + "/1",
      "method": method,
      "params": params,
      "userStats": {},
      "systemStats": [0, 0, 0, 0]
    };
    if (!content.params) delete content.params;

    content = JSON.stringify(content);

    var folderPromise = new Promise(function(resolve, reject) {
      request.post("https://" + host + "/wm/folder?" + paramStr({
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
        body: content
      }, function(err, response, body) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var data = handleAuthFail(body, response, self);
        if (data && !data.error) {
          resolve(data.result);
          callback(null, data.result);
        }
        else if (data && data.error) {
          reject(data.error);
          callback(data.error);
        }
        else {
          self.Mail.__folder(method, params, callback).then(resolve);
        }
      });
    });

    return folderPromise;
  },
  __preference(callback) {
    var self = this;
    var host = "p44-mailws.icloud.com";
    var content = JSON.stringify({
      "jsonrpc": "2.0",
      "id": (new Date().getTime()) + "/1",
      "method": "list",
      "params": {
        "locale": self.clientSettings.language,
        "timeZone": self.clientSettings.timezone
      },
      "userStats": {
        "dm": "Widescreen",
        "ost": "Date",
        "osv": "Descending",
        "al": 0,
        "vro": 2,
        "so": 2
      },
      "systemStats": [0, 0, 0, 0]
    });
    request.post("https://" + host + "/wm/preference?" + paramStr({
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
      body: content
    }, function(err, response, body) {
      if (err) return callback(err);
      var data = handleAuthFail(body, response, self);
      if (data) {
        callback(null, data.result);
      }
      else {
        self.Mail.__preference(callback);
      }
    });
  }
}

function handleAuthFail(body, response, self) {
  try {
    var result = JSON.parse(body);
  } catch (e) {
    // Parse new cookies from response headers & update cookies of current session
    self.auth.cookies = fillCookies(self.auth.cookies, parseCookieStr(response.headers["set-cookie"]));
    self.emit("sessionUpdate");
    // Try it again
    return null;
  } finally {

  }
  return result;
}
function getFolder(messages) {
  var folder = messages[0].folder;
  for (var i = 0; i < messages.length; i++) {
    if (messages[i].folder != folder) return null;
  }
  return folder;
}
