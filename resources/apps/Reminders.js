const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, timeArray, arrayTime, fillDefaults} = require("./../helper");

module.exports = {
  getOpenTasks(callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.reminders);

    var taskPromise = new Promise(function(resolve, reject) {
      //https://p44-remindersws.icloud.com/rd/startup?clientBuildNumber=17EProject65&clientId=A100C28C-110F-41C2-9E33-A8561E44033A&clientMasteringNumber=17E57&clientVersion=4.0&dsid=11298614181&lang=de-de&usertz=US%2FPacific
      request.get("https://" + host + "/rd/startup?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "usertz": self.clientSettings.timezone
      }), {
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

        self.Reminders.collections = result.Collections;

        result.Collections.forEach(function(collection) {
          collection.createdDate = arrayTime(collection.createdDate);
          collection.tasks = [];
        });

        result.Reminders.forEach(function(reminder) {
          reminder.alarms.forEach(function(alarm) {
            alarm.onDate = arrayTime(alarm.onDate);
          });
          reminder.createdDate = arrayTime(reminder.createdDate);
          reminder.lastModifiedDate = arrayTime(reminder.lastModifiedDate);
          reminder.dueDate = arrayTime(reminder.dueDate);

          result.Collections[result.Collections.indexOfKey(reminder.pGuid, "guid")].tasks.push(reminder);

          //console.log(reminder);
        });
        resolve(result.Collections);
        callback(null, result.Collections);
      });
    });

    return taskPromise;
  },
  changeTask(task, callback = function() {}) {
    var self = this;

    task.lastModifiedDate = new Date();

    return self.Reminders.__task(task, callback, "PUT");
  },
  __task(task, callback = function() {}, methodOverride = false) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.reminders);

    var taskPromise = new Promise(function(resolve, reject) {
      task.createdDate = timeArray(task.createdDate);
      task.lastModifiedDate = timeArray(task.lastModifiedDate);
      task.dueDate = timeArray(task.dueDate);
      task.startDate = timeArray(task.startDate);

      if ("alarms" in task) {
        task.alarms.forEach(function(alarm) {
          alarm.onDate = timeArray(alarm.onDate);
        });
      }

      var content = JSON.stringify({
        "Reminders": task,
        "ClientState": {
          "Collections": [

          ]
        }
      });

      request.post("https://" + host + "/rd/reminders/tasks?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "clientVersion": 5.1,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "usertz": self.clientSettings.timezone,
        "methodOverride": methodOverride || "POST",
        "ifMatch": task.etag ? encodeURIComponent(task.etag) : ""
      }), {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          'Content-Length': content.length
        } ,self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var result = JSON.parse(body);
        resolve(result);
        callback(null, result);
      });
    });


    return taskPromise;
  },
  completeTask(task, callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.reminders);

    var completePromise = new Promise(function(resolve, reject) {
      task.completedDate = timeArray(new Date());
      task.createdDate = timeArray(task.createdDate);
      task.lastModifiedDate = timeArray(task.lastModifiedDate);

      var content = JSON.stringify({
        "Reminders": task,
        "ClientState": {
          "Collections": [

          ]
        }
      });

      request.post("https://" + host + "/rd/reminders/" + task.pGuid + "?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "usertz": self.clientSettings.timezone,
        "methodOverride": "PUT"
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
        var result = JSON.parse(body);
        resolve(result);
        callback(null, result);
      });
    });

    return completePromise;
  },
  getCompletedTasks(callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.reminders);
    var taskPromise = new Promise(function(resolve, reject) {
      //https://p44-remindersws.icloud.com/rd/completed?clientBuildNumber=17EProject65&clientId=2E1D48B0-04F1-453B-864C-E7A30080AA2F&clientMasteringNumber=17E57&clientVersion=4.0&dsid=11298614181&lang=de-de&usertz=US%2FPacific
      request.get("https://" + host + "/rd/completed?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "usertz": self.clientSettings.timezone
      }), {
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

        result.Reminders.forEach(function(task) {
          task.createdDate = arrayTime(task.createdDate);
          task.lastModifiedDate = arrayTime(task.lastModifiedDate);
          task.completedDate = arrayTime(task.completedDate);
          task.dueDate = arrayTime(task.dueDate);
          task.alarms.forEach(function(alarm) {
            alarm.onDate = arrayTime(alarm.onDate);
          });
        });
        resolve(result.Reminders);
        callback(null, result.Reminders);
      });
    });

    return taskPromise;
  },
  createTask(task, callback = function() {}) {
    var self = this;

    task = fillDefaults(task, {
      "title": null,
      "description": null,
      "pGuid": "tasks",
      "etag": null,
      "order": null,
      "priority": 0,
      "recurrence": null,
      "alarms": [],
      "createdDateExtended": new Date().getTime(),
      "guid": newId(),
      "startDate": null,
      "startDateTz": null,
      "startDateIsAllDay": false,
      "completedDate": null,
      "dueDate": null,
      "dueDateIsAllDay": false,
      "lastModifiedDate": null,
      "createdDate": new Date(),
      "isFamily": null
    });
    return self.Reminders.__task(task, callback, "POST");
  },
  openTask(task, callback) {

    /*
      Not working yet because of Apple's API
    */

    var self = this;
    delete task.completedDate;

    self.Reminders.changeTask(task, callback);
  },
  deleteTask(task, callback = function() {}) {
    var self = this;

    task = {
      "guid": task.guid,
      "etag": task.etag,
      "pGuid": task.pGuid
    }

    return self.Reminders.__task([task], callback, "DELETE");
  },
  __collection(collection, callback = function() {}, methodOverride = false) {
    //https://p44-remindersws.icloud.com/rd/collections/9E489E0F-B5FF-4D3E-AC45-FBE1B3C04231?clientBuildNumber=17EProject65&clientId=082F853D-784D-408B-8BF3-2F4DEE703E49&clientMasteringNumber=17E57&clientVersion=4.0&dsid=11298614181&ifMatch=FT%3D-%40RU%3Dc16342e5-f8fd-4909-9157-7b2b23e0b38d%40S%3D353&lang=de-de&methodOverride=DELETE&usertz=US%2FPacific
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.reminders);


    var content = JSON.stringify({
      "Collections": collection,
      "ClientState": {
        "Collections": [

        ]
      }
    });

    var collectionPromise = new Promise(function(resolve, reject) {
      request.post("https://" + host + "/rd/collections/" + collection.guid + "?" + paramStr((function() {
        var args = {
          "clientBuildNumber": self.clientSettings.clientBuildNumber,
          "clientId": self.clientId,
          "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
          "dsid": self.account.dsInfo.dsid,
          "lang": self.clientSettings.language,
          "usertz": self.clientSettings.timezone,
          "methodOverride": methodOverride,
          "ifMatch": encodeURIComponent(collection.ctag)
        }
        if (!args["methodOverride"]) {
          delete args["methodOverride"];
        }
        return args;
      })()), {
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
        resolve(result);
        callback(null, result);
      });
    });


    return collectionPromise;
  },
  deleteCollection(collection, callback = function() {}) {
    var self = this;

    collection = {
      guid: collection.guid
    }

    return self.Reminders.__collection(collection, callback, "DELETE");
  },
  createCollection(collection, callback = function() {}) {
    var self = this;

    collection = fillDefaults(collection, {
      "order": 2,
      "title": "New Collection",
      "color": "#b14bc9",
      "participants": null,
      "ctag": null,
      "enabled": true,
      "symbolicColor": null,
      "guid": newId(),
      "lastModifiedDate": null,
      "createdDate": null,
      "createdDateExtended": null,
      "completedCount": 0,
      "emailNotification": false,
      "collectionShareType": null
    });

    return self.Reminders.__collection(collection, callback);
  },
  changeCollection(collection, callback = function() {}) {
    var self = this;

    collection.lastModifiedDate = timeArray(new Date());

    return self.Reminders.__collection(collection, callback, "PUT");
  }

}
