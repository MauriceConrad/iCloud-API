const request = require('request');
const EventEmitter = require('events');
const protobuf = require('protobufjs');
const zlib = require('zlib');
const path = require('path');

var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, newId, indexOfKey, paramString, paramStr, timeArray, arrayTime, fillDefaults} = require("./../helper");



module.exports = {
  fetch() {
    var self = this;

    const emitter = Object.assign(new EventEmitter(), {
      __records: []
    });
    Object.defineProperty(emitter, "__folders", {
      get() {
        return this.__records.filter(record => record.recordType === "Folder");
      }
    });
    Object.defineProperty(emitter, "__notes", {
      get() {
        return this.__records.filter(record => {
          return (
                  record.recordType === "Note" ||
                  record.recordType === "Note_UserSpecific"
                );
        });
      }
    });
    Object.defineProperty(emitter, "folders", {
      get() {
        return this.__folders.map(folder => {
          folder.notes = this.__notes.filter(note => {
            const noteParentFolder = (() => {
              if (note.parent) {
                return note.parent;
              }
              else {
                if (note.fields.Folder) {
                  return note.fields.Folder.value;
                }
                // Mostly if note is deleted
                else {}
              }
            })();
            return noteParentFolder ? (noteParentFolder.recordName === folder.recordName) : undefined;
          });
          return folder;
        });
      }
    });




    var requestId = 0;

    self.Notes.__zone(undefined, handleZone);
    function handleZone(err, zone) {
      if (err) {
        reject(err);
        return callback(err);
      }

      requestId++;

      if (zone.records.length > 0) {
        emitter.__records = emitter.__records.concat(zone.records);
        emitter.emit("data", zone);
      }
      if (zone.moreComing) {
        self.Notes.__zone(zone.syncToken, handleZone);
      }
      else {
        emitter.emit("end");
      }
    }

    return emitter;
  },
  async resolve(...notes) {
    const self = this;

    const result = await self.Notes.__lookup(notes);

    return result.records.map(record => {
      // Decrypt title & snippet
      record.fields.title = decryptBase64(record.fields.TitleEncrypted.value).toString();
      record.fields.snippet = decryptBase64(record.fields.SnippetEncrypted.value).toString();

      const data = decryptBase64(record.fields.TextDataEncrypted.value);
      record.fields.documentData = (data[0] === 0x1f && data[1] === 0x8b) ? zlib.gunzipSync(data) : zlib.inflateSync(data);

      // load protobuf definitions
      const root = getProtobufRoot();

      const Document = root.lookupType("versioned_document.Document");
      const StringData = root.lookupType("topotext.String");

      record.fields.document = Document.decode(record.fields.documentData);
      record.fields.text = StringData.decode(record.fields.document.version[record.fields.document.version.length - 1].data);

      return record;
    });

  },
  resolve(...notes) {
    const self = this;

    return new Promise(function(resolve, reject) {
      var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

      const content = JSON.stringify({
        "shortGUIDs": notes.map(note => ({
          "value": typeof note == "string" ? note : note.shortGUID
        }))
      });


      request.post("https://" + host + "/database/1/com.apple.cloudkit/production/public/records/resolve?" + paramStr({
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

        const records = result.results.map(res => res.rootRecord).map(record => {
          // Decrypt title & snippet
          record.fields.title = decryptBase64(record.fields.TitleEncrypted.value).toString();
          record.fields.snippet = decryptBase64(record.fields.SnippetEncrypted.value).toString();

          const data = decryptBase64(record.fields.TextDataEncrypted.value);
          record.fields.documentData = (data[0] === 0x1f && data[1] === 0x8b) ? zlib.gunzipSync(data) : zlib.inflateSync(data);

          // load protobuf definitions
          const root = getProtobufRoot();

          const Document = root.lookupType("versioned_document.Document");
          const StringData = root.lookupType("topotext.String");

          record.fields.document = Document.decode(record.fields.documentData);
          record.fields.text = StringData.decode(record.fields.document.version[record.fields.document.version.length - 1].data);

          return record;
        });

        resolve(records);
      });
    });

  },
  __zone(syncToken = undefined, callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

    var content = JSON.stringify({
      "zones": [
        {
          "zoneID": {
            "zoneName": "Notes",
            "zoneType": "REGULAR_CUSTOM_ZONE"
          },
          "desiredKeys": [
            "TitleEncrypted",
            "SnippetEncrypted",
            "FirstAttachmentUTIEncrypted",
            "FirstAttachmentThumbnail",
            "FirstAttachmentThumbnailOrientation",
            "ModificationDate",
            "Deleted",
            "Folders",
            "Folder",
            "Attachments",
            "ParentFolder",
            "Folder",
            "Note",
            "LastViewedModificationDate",
            "MinimumSupportedNotesVersion"
          ],
          "desiredRecordTypes": [
            "Note",
            "SearchIndexes",
            "Folder",
            "PasswordProtectedNote",
            "User",
            "Users",
            "Note_UserSpecific",
            "cloudkit.share"
          ],
          "syncToken": syncToken,
          "reverse": true
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
  __lookup(records) {
    var self = this;

    return new Promise(function(resolve, reject) {
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
        if (err) return reject(err);
        const result = JSON.parse(body);
        resolve(result);
      });
    });
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

function decryptBase64(value) {
  return Buffer.from(value, "base64");
}
function encryptBase64(value) {
  return Buffer.from(value, "utf8");
}

function getProtobufRoot() {
   if (!this.protobufRoot) {
     const paths = ["versioned-document.proto", "topotext.proto"/*, "crframework.proto"*/].map(p => path.join(__dirname, '../protobuf/', p));
     this.protobufRoot = protobuf.loadSync(paths);
   }
   return this.protobufRoot;
 }
