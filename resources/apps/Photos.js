const request = require('request');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, paramString, fillDefaults} = require("./../helper");

module.exports = {
  get(callback = function() {}) {
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);

    var photosPromise = new Promise(function(resolve, reject) {
      request.get("https://" + host + "/database/1/com.apple.photos.cloud/production/private/zones/list?remapEnums=true&ckjsBuildVersion=17DProjectDev77&ckjsVersion=2.0.5&getCurrentSyncToken=true&clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid, {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies)
        }, self.clientSettings.defaultHeaders)
      }, function(err, response, body) {
        if (err) {
          reject(err);
          return console.error(err);
        }
        var result = JSON.parse(body);

        if ("set-cookie" in response.headers) {
          var cookies = parseCookieStr(response.headers["set-cookie"]);
          self.auth.cookies = fillCookies(self.auth.cookies, cookies);
        }
        //console.log(result.zones);
        var content = {
          "records": [
            {
              "recordName": "PrimarySync-0000-ZS"
            }
          ],
          "zoneID": {
            "zoneName": "PrimarySync"
          }
        };
        content = JSON.stringify(content);

        if ("error" in result) {
          return reject({
            error: result.reason,
            code: 12
          });
        }

        var content = {
          "query": {
            "recordType": "CPLAssetAndMasterByAssetDateWithoutHiddenOrDeleted",
            "filterBy": [
              {
                "fieldName": "startRank",
                "comparator": "EQUALS",
                "fieldValue": {
                  "value": 0,
                  "type": "INT64"
                }
              },
              {
                "fieldName": "direction",
                "comparator": "EQUALS",
                "fieldValue": {
                  "value": "ASCENDING",
                  "type": "STRING"
                }
              }
            ]
          },
          "zoneID": {
            "zoneName": result.zones[0].zoneID.zoneName
          },
          "desiredKeys": [
            "resJPEGFullWidth",
            "resJPEGFullHeight",
            "resJPEGFullFileType",
            "resJPEGFullFingerprint",
            "resJPEGFullRes",
            "resJPEGLargeWidth",
            "resJPEGLargeHeight",
            "resJPEGLargeFileType",
            "resJPEGLargeFingerprint",
            "resJPEGLargeRes",
            "resJPEGMedWidth",
            "resJPEGMedHeight",
            "resJPEGMedFileType",
            "resJPEGMedFingerprint",
            "resJPEGMedRes",
            "resJPEGThumbWidth",
            "resJPEGThumbHeight",
            "resJPEGThumbFileType",
            "resJPEGThumbFingerprint",
            "resJPEGThumbRes",
            "resVidFullWidth",
            "resVidFullHeight",
            "resVidFullFileType",
            "resVidFullFingerprint",
            "resVidFullRes",
            "resVidMedWidth",
            "resVidMedHeight",
            "resVidMedFileType",
            "resVidMedFingerprint",
            "resVidMedRes",
            "resVidSmallWidth",
            "resVidSmallHeight",
            "resVidSmallFileType",
            "resVidSmallFingerprint",
            "resVidSmallRes",
            "resSidecarWidth",
            "resSidecarHeight",
            "resSidecarFileType",
            "resSidecarFingerprint",
            "resSidecarRes",
            "itemType",
            "dataClassType",
            "mediaMetaDataType",
            "mediaMetaDataEnc",
            "filenameEnc",
            "originalOrientation",
            "resOriginalWidth",
            "resOriginalHeight",
            "resOriginalFileType",
            "resOriginalFingerprint",
            "resOriginalRes",
            "resOriginalAltWidth",
            "resOriginalAltHeight",
            "resOriginalAltFileType",
            "resOriginalAltFingerprint",
            "resOriginalAltRes",
            "resOriginalVidComplWidth",
            "resOriginalVidComplHeight",
            "resOriginalVidComplFileType",
            "resOriginalVidComplFingerprint",
            "resOriginalVidComplRes",
            "isDeleted",
            "isExpunged",
            "dateExpunged",
            "remappedRef",
            "recordName",
            "recordType",
            "recordChangeTag",
            "masterRef",
            "adjustmentRenderType",
            "assetDate",
            "addedDate",
            "isFavorite",
            "isHidden",
            "orientation",
            "duration",
            "assetSubtype",
            "assetSubtypeV2",
            "assetHDRType",
            "burstFlags",
            "burstFlagsExt",
            "burstId",
            "captionEnc",
            "locationEnc",
            "locationV2Enc",
            "locationLatitude",
            "locationLongitude",
            "adjustmentType",
            "timeZoneOffset",
            "vidComplDurValue",
            "vidComplDurScale",
            "vidComplDispValue",
            "vidComplDispScale",
            "vidComplVisibilityState",
            "customRenderedValue",
            "containerId",
            "itemId",
            "position",
            "isKeyAsset"
          ],
          "resultsLimit": 100000
        };

        content = JSON.stringify(content);
        request.post("https://" + host + "/database/1/com.apple.photos.cloud/production/private/records/query?remapEnums=true&ckjsBuildVersion=17DProjectDev77&ckjsVersion=2.0.5&getCurrentSyncToken=true&clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid, {
          headers: fillDefaults({
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'Content-Length': content.length
          }, self.clientSettings.defaultHeaders),
          body: content
        }, function(err, response, body) {
          if (err) {
            reject(err);
            return console.error(err);
          }
          var result = JSON.parse(body);
          var images = result.records.filter(function(record) {
            return record.recordType == "CPLMaster";
          }).map(function(record) {
            //console.log(record);
            var image = {
              __recordName: record.recordName,
              width: record.fields.resOriginalWidth.value,
              height: record.fields.resOriginalHeight.value,
              orientation: record.fields.originalOrientation.value,
              filetype: record.fields.resOriginalFileType.value.replace("public.", ""),
              fingerprint: record.fields.resOriginalFingerprint.value,
              size: record.fields.resOriginalRes.value.size,
              original: record.fields.resOriginalRes.value.downloadURL,
              thumbnail: record.fields.resJPEGThumbRes.value.downloadURL
            }
            image.original = image.original.replace("${f}", image.fingerprint + "." + image.filetype);
            image.thumbnail = image.thumbnail.replace("${f}", image.fingerprint + "." + image.filetype);

            var refMetaRecord = findMetaRecord(image.__recordName, result.records);

            var meta = {
              __recordName: refMetaRecord.recordName,
              date: refMetaRecord.fields.assetDate.value,
              subtypeV2: "assetSubtypeV2" in refMetaRecord.fields ? refMetaRecord.fields.assetSubtypeV2.value : null,
              HDRType: "assetHDRType" in refMetaRecord.fields ? refMetaRecord.fields.assetHDRType.value : null,
              timeZoneOffset: refMetaRecord.fields.timeZoneOffset.value,
              duration: "duration" in refMetaRecord.fields ? refMetaRecord.fields.duration.value : 0,
              favorite: ("isFavorite" in refMetaRecord.fields ? refMetaRecord.fields.isFavorite.value : null) ? true : false,
              created: refMetaRecord.created.timestamp,
              modified: refMetaRecord.modified.timestamp
            }
            image.meta = meta;
            return image;
          });
          resolve(images);
          callback(null, images);
        });


      });
    });

    return photosPromise;

  },
  upload(file, callback) {
    //https://p44-uploadimagews.icloud.com/upload?filename=big-drogen1.jpg&dsid=11298614181&lastModDate=1497953695000&timezoneOffset=-120
    var self = this;
    var host = getHostFromWebservice(self.account.webservices.ckdatabasews);
    var content = fs.readFileSync(file);
    request("https://" + host + "/upload?filename=" + file.jpg + "&dsid=" + self.account.dsInfo.dsid + "&lastModDate=" + (new Date().getTime()) + "&timezoneOffset=-120", {
      method: "POST",
      headers: fillDefaults({
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }, self.clientSettings.defaultHeaders)
    }, function(err, response, body) {
      if (err) return callback(err);
      console.log(body);
      var result = JSON.parse(body);
      callback(null, result);

    });
  }
}

function findMetaRecord(recordName, records) {
  for (var i = 0; i < records.length; i++) {
    if ("masterRef" in records[i].fields && records[i].fields.masterRef.value.recordName === recordName) {
      return records[i];
    }
  }
  return null;
}
