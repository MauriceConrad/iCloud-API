const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, fillDefaults} = require("./../helper");


module.exports = {
  list(callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.contacts);
    var requestPromise = new Promise(function(resolve, reject) {
      request.get("https://" + host + "/co/startup?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientId=" + self.clientId + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientVersion=2.1&dsid=" + self.account.dsInfo.dsid + "&locale=de_DE&order=first%2Clast", {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies)
        }, self.clientSettings.defaultHeaders)
      }, function(err, response, body) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var result = JSON.parse(body);

        self.Contacts.syncToken = result.syncToken;
        self.Contacts.prefToken = result.prefToken;

        resolve(result);
        callback(null, result);
      });
    });

    return requestPromise;
  },
  __card(contacts, callback = function() {}, method) {
    var self = this;

    var requestPromise = new Promise(function(resolve, reject) {
      var content = {
        "contacts": contacts
      };
      content = JSON.stringify(content);
      if (!("syncToken" in self.Contacts)) {
        var errorObj = {
          error: 'No "syncToken" found! Please call "Contacts.list()" to initialize the Contacts services!',
          errorCode: 4
        };
        reject(errorObj);
        return callback(errorObj);
      }
      var host = getHostFromWebservice(self.account.webservices.contacts);
      request.post("https://" + host + "/co/contacts/card/?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientId=" + self.clientId + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientVersion=2.1&dsid=" + self.account.dsInfo.dsid + "&method=" + method + "&prefToken=" + self.Contacts.prefToken + "&syncToken=" + self.Contacts.syncToken, {
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
        var result = JSON.parse(body);
        if ("errorCode" in result) return callback(result);
        self.Contacts.syncToken = result.syncToken;
        self.Contacts.prefToken = result.prefToken;


        resolve(result);
        callback(null, result);
      });
    });

    return requestPromise;
  },
  change(contacts, callback = function() {}) {
    var self = this;
    if (!(contacts instanceof Array)) {
      contacts = [contacts];
    }
    return self.Contacts.__card(contacts, callback, "PUT");
  },
  new(contacts, callback = function() {}) {
    var self = this;
    if (!(contacts instanceof Array)) {
      contacts = [contacts];
    }
    contacts = contacts.map(function(contact) {
      if (!("contactId" in contact)) contact["contactId"] = newId();
      return contact;
    });
    return self.Contacts.__card(contacts, callback, "");
  },
  delete(contacts, callback = function() {}) {
    var self = this;
    if (!(contacts instanceof Array)) {
      contacts = [contacts];
    }
    contacts = contacts.map(function(contact) {
      return {
        contactId: contact.contactId,
        etag: contact.etag
      }
    });
    return self.Contacts.__card(contacts, callback, "DELETE");
  }
}
