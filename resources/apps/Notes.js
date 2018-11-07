const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, timeArray, arrayTime, fillDefaults} = require("./../helper");



module.exports = {
  getAll(callback = function() {}) {
    var self = this;

    var records = [];

    requestId = 0;

    var notesPromise = new Promise(function(resolve, reject) {
      self.Notes.__zone(undefined, handleZone);
      function handleZone(err, zone) {
        if (err) {
          reject(err);
          return callback(err);
        }

        requestId++;

        zone.records = zone.records.map(function(record) {
          if (record.recordType === "Note") record = simplifyNote(record);
          if (record.recordType === "Folder") record = simplifyFolder(record);
          delete record.fields;
          return record;
        });

        records = records.concat(zone.records);

        self.emit("progress", {
          parentAction: "getAll",
          action: "loading-records",
          progress: null,
          requestId: requestId,
          zone: zone
        });


        if (zone.moreComing) {
          self.Notes.__zone(zone.syncToken, handleZone);
        }
        else {
          var folders = records.filter(record => record.recordType === "Folder");
          var notes = records.filter(record => record.recordType === "Note");

          var data = folders.map(function(folder) {
            folder.notes = notes.filter(note => note.parent.recordName === folder.recordName);
            return folder;
          });

          // Simplify data
          data.forEach(function(folder) {



          });
          resolve(data);
          callback(null, data);
        }
      }
    });

    return notesPromise;

  },
  __zone(syncToken = undefined, callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

    var content = JSON.stringify({
      "zones": [
        {
          "zoneID": {
            "zoneName": "Notes"
          },
          "desiredKeys": [
            "TitleEncrypted",
            "SnippetEncrypted",
            "TextDataEncrypted",
            "Content",
            "FirstAttachmentUTIEncrypted",
            "FirstAttachmentThumbnail",
            "FirstAttachmentThumbnailOrientation",
            "ModificationDate",
            "Deleted",
            "Folders",
            "Attachments",
            "ParentFolder",
            "TextDataAsset",
            "Folder",
            "Note",
            "LastViewedModificationDate"
          ],
          "desiredRecordTypes": [
            "Note",
            "Folder",
            "PasswordProtectedNote",
            "User",
            "Users",
            "Note_UserSpecific"
          ],
          "reverse": false,
          "syncToken": syncToken
        }
      ]
    });

    request.post("https://" + host + "/database/1/com.apple.notes/production/private/changes/zone?" + paramStr({
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
      var result = JSON.parse(body);

      callback(null, result.zones[0]);
    });
  },
  getFolders(folders, callback) {
    var self = this;
    folders = folders instanceof Array ? folders : [folders];
    self.Notes.__lookup(folders, function(err, result) {
      if (err) {
        callback(err);
      }
      result.forEach(function(record) {
        if (record.recordType === "Folder") {
          record = simplifyFolder(record);
          delete record.fields;
        }
      });
      callback(null, result);
    });
  },
  getNotes(notes, callback) {
    var self = this;
    notes = notes instanceof Array ? notes : [notes];
    self.Notes.__lookup(notes, function(err, result) {
      if (err) {
        callback(err);
      }
      result.forEach(function(record) {
        if (record.recordType === "Note") {
          record = simplifyNote(record);
          delete record.fields;
        }
      });
      callback(null, result);
    });
  },
  createFolders(folders, callback) {
    var self = this;
    folders = folders instanceof Array ? folders : [folders];

    var operations = folders.map(function(folder) {
      return {
        "operationType": "create",
        "record": {
          "recordName": newId().toLowerCase(),
          "fields": {
            "TitleEncrypted": {
              "value": encryptBase64(folder).toString("base64")
            }
          },
          "recordType": "Folder"
        }
      };
    });
    //operations = [{"operationType":"create","record":{"recordName":"r03e0ee1-7f72-41cd-b3c6-88e8d8452f51","fields":{"TitleEncrypted":{"value":"TmV1"}},"recordType":"Folder"}}]
    content = JSON.stringify({"operations":[{"operationType":"create","record":{"recordName":"d23e0ee1-7f72-41cd-b3c6-88e8d8452f51","fields":{"TitleEncrypted":{"value":"TmV1","type":"ENCRYPTED_BYTES"}},"recordType":"Folder"}}],"zoneID":{"zoneName":"Notes"}});
    self.Notes.__modify(content, function(err, result) {
      if (err) return callback(err);
      callback(null, result.records);
    });
  },
  __lookup(records, callback) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

    var content = JSON.stringify({
      "records": records.map(record => ({
        recordName: typeof record === "object" ? record.recordName : record
      })),
      "zoneID": {
        "zoneName": "Notes"
      }
    });
    request.post("https://" + host + "/database/1/com.apple.notes/production/private/records/lookup?" + paramStr({
      "clientBuildNumber": self.clientSettings.clientBuildNumber,
      "clientId": self.clientId,
      "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
      "dsid": self.account.dsInfo.dsid,
      "remapEnums": true,
      "ckjsVersion": "2.0"
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
      callback(null, result.records);
    })
  },
  __modify(content, callback) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

    request.post("https://" + host + "/database/1/com.apple.notes/production/private/records/modify?" + paramStr({
      "clientBuildNumber": self.clientSettings.clientBuildNumber,
      "clientId": self.clientId,
      "clientMasteringNumber": self.clientSettings.clientMasteringNumber,
      "dsid": self.account.dsInfo.dsid,
      "remapEnums": true,
      "ckjsVersion": "2.0"
    }), {
      headers: fillDefaults({
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }, self.clientSettings.defaultHeaders),
      body: content
    }, function(err, response, body) {
      if (err) return console.error(err);
      var result = JSON.parse(body);
      callback(null, result);
    });
  }
}
function simplifyNote(note) {
  note.title = decryptBase64(note.fields.TitleEncrypted.value).toString();
  note.snippet = decryptBase64(note.fields.SnippetEncrypted.value).toString();
  note.data = decryptBase64(note.fields.TextDataEncrypted.value);
  note.parent = note.parent ? note.parent : note.fields.Folders.value[0];
  if ("ModificationDate" in note.fields) note.ModificationDate = note.fields.ModificationDate.value;
  return note;
}
function simplifyFolder(folder) {
  folder.title = decryptBase64(folder.fields.TitleEncrypted.value).toString();
  if ("TitleModificationDate" in folder.fields) folder.titleModificationDate = folder.fields.TitleModificationDate.value;
  if ("ParentFolder" in folder.fields) folder.parentFolder = folder.fields.ParentFolder.value;
  return folder;
}
function decryptBase64(value) {
  return Buffer.from(value, "base64");
}
function encryptBase64(value) {
  return Buffer.from(value, "utf8");
}
