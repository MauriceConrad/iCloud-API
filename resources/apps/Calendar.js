const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, timeArray, arrayTime, fillDefaults} = require("./../helper");


module.exports = {
  getEvents(startDate, endDate, callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.calendar);
    var events = [];
    var eventsPromise = new Promise(function(resolve, reject) {
      request.get("https://" + host + "/ca/events?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "clientVersion": 5.1,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "requestID": 4,
        "startDate": startDate,
        "endDate": endDate,
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
        if (result.status === 421) {
          reject(result.status);
          return callback(result.status);
        }

        var requestEventsCount = result.Event.length;
        var count = 0;
        result.Event.forEach(function(event, index) {
          request.get("https://" + host + "/ca/eventdetail/" + event.pGuid + "/" + event.guid + "?" + paramStr({
            "clientBuildNumber": self.clientSettings.clientBuildNumber,
            "clientId": self.clientId,
            "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
            "clientVersion": 5.1,
            "dsid": self.account.dsInfo.dsid,
            "lang": self.clientSettings.language,
            "requestID": 4,
            "startDate": startDate,
            "endDate": endDate,
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
            events = events.concat(result.Event.map(function(event) {
              event.startDate = arrayTime(event.startDate);
              event.endDate = arrayTime(event.endDate);
              event.createdDate = arrayTime(event.createdDate);
              event.lastModifiedDate = arrayTime(event.lastModifiedDate);
              event.localStartDate = arrayTime(event.localStartDate);
              event.localEndDate = arrayTime(event.localEndDate);

              event.alarms = event.alarms.map(function(alarmGuidId) {
                return result.Alarm[result.Alarm.indexOfKey(alarmGuidId, "guid")];
              });
              if ("Recurrence" in result) {
                event.recurrence = result.Recurrence[result.Recurrence.indexOfKey(event.recurrence, "guid")];
                if (event.recurrence && "until" in event.recurrence) event.recurrence.until = arrayTime(event.recurrence.until);
                if (event.recurrence && "recurrenceMasterStartDate" in event.recurrence) event.recurrence.recurrenceMasterStartDate = arrayTime(event.recurrence.recurrenceMasterStartDate);
              }
              return event;
            }));
            count++;
            var progress = count / (requestEventsCount + 1);
            self.emit("progress", {
              action: "event-detail",
              parentAction: "getEvents",
              progress: progress
            });

            if (count >= requestEventsCount) {
              resolve(events);
              callback(null, events);
            }
          });
        });
        self.emit("progress", {
          action: "list-events",
          parentAction: "getEvents",
          progress: 1 / (requestEventsCount + 1)
        });
        if (result.Event.length <= 0) {
          resolve(events);
          callback(null, events);
        }
      });
    });

    return eventsPromise;
  },
  getCollections(callback = function() {}) {
    var self = this;

    var startDate = new Date();
    startDate = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
    var endDate = startDate;

    var host = getHostFromWebservice(self.account.webservices.calendar);
    var collectionsPromise = new Promise(function(resolve, reject) {
      request.get("https://" + host + "/ca/startup?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "clientVersion": 5.1,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "requestID": 4,
        "startDate": startDate,
        "endDate": endDate,
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
        if (result.status === 400) {
          reject(result);
          return callback(result);
        }
        self.Calendar.collections = result.Collection;
        resolve(result.Collection);
        callback(null, result.Collection);
      });
    });

    return collectionsPromise;
    //https://p44-calendarws.icloud.com/ca/startup?clientBuildNumber=17DProject78&clientId=808A0397-2A8E-4BA0-8AB4-76DD91E95B60&clientMasteringNumber=17D68&clientVersion=5.1&dsid=11298614181&endDate=2017-07-24&lang=de-de&requestID=3&startDate=2017-07-17&usertz=US%2FPacific
  },
  createEvent(event, callback = function() {}) {
    var self = this;

    var eventGuid = newId();

    event.alarms = event.alarms.map(function(alarm) {
      return {
        messageType: 'message',
        measurement: alarm,
        description: 'Event reminder',
        pGuid: eventGuid,
        guid: eventGuid + ":" + newId(),
        isLocationBased: false
      }
    });
    //console.log(event.alarms);
    event.recurrence = fillDefaults(event.recurrence, {
      pGuid: eventGuid,
      guid: eventGuid + '*MME-RID',
      recurrenceMasterStartDate: null, // [ 20170726, 2017, 7, 26, 19, 0, 1140 ]
      weekStart: null,
      freq: 'daily',
      count: null,
      interval: 1,
      byDay: null,
      byMonth: null,
      until: null,
      frequencyDays: null,
      weekDays: null
    });

    event = fillDefaults(event, {
      guid: eventGuid,
      pGuid: 'home',
      etag: null,
      extendedDetailsAreIncluded: true,
      lastModifiedDate: null,
      createdDate: new Date(),
      updatedByName: null,
      updatedByNameFirst: null,
      updatedByNameLast: null,
      updatedByDate: null,
      createdByName: null,
      createdByNameFirst: null,
      createdByNameLast: null,
      createdByDate: null,
      eventStatus: null,
      birthdayFirstName: null,
      birthdayLastName: null,
      birthdayNickname: null,
      birthdayCompanyName: null,
      birthdayShowAsCompany: null,
      birthdayIsYearlessBday: null,
      birthdayBirthDate: null,
      title: 'New Event',
      location: null,
      url: null,
      description: null,
      startDate: new Date(),
      endDate: new Date(),
      allDay: false,
      tz: self.clientSettings.timezone,
      duration: 60,
      localStartDate: event.startDate,
      localEndDate: event.endDate,
      icon: 0,
      hasAttachments: false,
      shouldShowJunkUIWhenAppropriate: true,
      alarms: [],
      recurrence: null,
      recurrenceMaster: true,
      recurrenceException: true,
      readOnly: false,
      invitees: null,
      organizer: null
    });

    return self.Calendar.__event(event, false, callback, false);
  },
  createCollection(collection, callback = function() {}) {
    var self = this;

    //https://p44-calendarws.icloud.com/ca/collections/E9C67535-2CAF-46B9-852D-6D2E348D49AC?clientBuildNumber=17EProject67&clientId=0381983D-7B5E-4F37-8DC2-452B932AD099&clientMasteringNumber=17E57&clientVersion=5.1&dsid=11298614181&endDate=2017-09-02&lang=de-de&requestID=22&startDate=2017-06-26&usertz=US%2FPacific

    var guid = newId();

    var content = JSON.stringify({
      "Collection": {
        "supportedType": "Event",
        "extendedDetailsAreIncluded": true,
        "order": 3,
        "symbolicColor": collection.color || "#ff2d55",
        "color": collection.color || "#ff2d55",
        "guid": guid,
        "title": collection.title,
        "participants": null,
        "meAsParticipant": null,
        "deferLoading": null,
        "shareType": null,
        "shareTitle": "",
        "etag": null,
        "ctag": null,
        "objectType": "personal",
        "readOnly": null,
        "lastModifiedDate": null,
        "description": null,
        "sharedUrl": "",
        "ignoreAlarms": null,
        "enabled": true,
        "ignoreEventUpdates": null,
        "emailNotification": null,
        "removeTodos": null,
        "removeAlarms": null,
        "isDefault": null,
        "prePublishedUrl": null,
        "publishedUrl": null,
        "isFamily": null
      },
      "ClientState": {
        "Collection": [],
        "fullState": false,
        "userTime": 1234567890,
        "alarmRange": 60
      }
    });

    var startDate = new Date();
    startDate = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
    var endDate = startDate;

    var host = getHostFromWebservice(self.account.webservices.calendar);
    var createPromise = new Promise(function(resolve, reject) {
      request.post("https://" + host + "/ca/collections/" + guid + "?" + paramStr({
        "clientBuildNumber": self.clientSettings.clientBuildNumber,
        "clientId": self.clientId,
        "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
        "clientVersion": 5.1,
        "dsid": self.account.dsInfo.dsid,
        "lang": self.clientSettings.language,
        "requestID": 4,
        "startDate": startDate,
        "endDate": endDate,
        "usertz": self.clientSettings.timezone
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

    return createPromise;
  },
  deleteEvent(event, all = false, callback = function() {}) {
    var self = this;
    // Just call the event at its enpoint with DELETE as method
    return self.Calendar.__event(event, all, callback, "DELETE");

  },
  changeEvent(event, all = false, callback = function() {}) {
    var self = this;
    event.lastModifiedDate = new Date();
    return self.Calendar.__event(event, all, callback, "PUT");
  },
  __event(event, all, callback = function() {}, methodOverride) {
    // General accesing the endpoint of an event and run different methods ("PUT" = changing, "DELETE", = deleting, false = creating)

    var self = this;
    var host = getHostFromWebservice(self.account.webservices.calendar);
    var eventPromise = new Promise(function(resolve, reject) {

      if (!event) {
        reject({
          error: "Event invalid"
        });
      }

      var alarms = event.alarms;
      event.alarms = event.alarms.map(function(alarm) {
        return alarm.guid;
      });

      var recurrence = event.recurrence;
      if (recurrence && "until" in recurrence) recurrence.until = timeArray(recurrence.until);
      event.recurrence = event.recurrence ? event.recurrence.guid : null;


      event.startDate = timeArray(event.startDate);
      event.endDate = timeArray(event.endDate);
      event.createdDate = timeArray(event.createdDate);
      event.lastModifiedDate = timeArray(event.lastModifiedDate);
      event.localStartDate = timeArray(event.localStartDate);
      event.localEndDate = timeArray(event.localEndDate);

      //return console.log(event);


      //console.log(event);

      var content = {
        "Event": methodOverride == "DELETE" ? {} : event,
        "Recurrence": recurrence ? [
          recurrence
        ] : null,
        "Alarm": alarms,
        "ClientState": {
          "Collection": [

          ],
          "fullState": false,
          "userTime": 1234567890,
          "alarmRange": 60
        }
      };
      if (!content.Recurrence) delete content.Recurrence;

      //return console.log(content);

      content = JSON.stringify(content);

      var startDate = new Date();
      startDate = startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
      var endDate = startDate;


      request.post("https://" + host + "/ca/events/" + event.pGuid + "/" + event.guid + "/" + ((all && event.recurrence) ? "all" : "") + "?" + paramStr((function() {
        var args = {
          "clientBuildNumber": self.clientSettings.clientBuildNumber,
          "clientId": self.clientId,
          "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
          "clientVersion": 5.1,
          "dsid": self.account.dsInfo.dsid,
          "lang": self.clientSettings.language,
          //"startDate": startDate,
          //"endDate": endDate,
          "usertz": self.clientSettings.timezone,
          "methodOverride": methodOverride,
          "ifMatch": event.etag ? encodeURIComponent(event.etag) : null
        }
        if (!args["methodOverride"]) {
          delete args["methodOverride"];
        }
        if (!args["ifMatch"]) {
          delete args["ifMatch"];
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

    return eventPromise;
  }
}

function getCTag(etag) {
  return "FT=-@RU=" + etag.substring(etag.search(/[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}/)) + "@S=" + etag.substring(etag.search(/[0-9]{1,}/), etag.search("@"))
}
