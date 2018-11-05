const request = require('request');
const https = require('https');
var {getHostFromWebservice, cookiesToStr, parseCookieStr, fillCookies, fillDefaults} = require("./../helper");

function isFolder(item) {
  var folderTypes = ["FOLDER", "APP_LIBRARY"];
  return folderTypes.indexOf(item.type) > -1;
}

module.exports = {
  folderCache: {

  },
  getItem(itemPath, callback = function() {}, useCache = true) {
    var self = this;

    var itemArgType = itemPath.search("::com.apple.CloudDocs::") > -1 ? "drivewsid" : "unixPath";

    var filePromise = new Promise(function(resolve, reject) {
      if (itemArgType == "drivewsid") {
        // An item is requested directly by it's drivewsid
        // We can return it directtly if when is a FOLDER or, when it is a FILE, loading it and return it afterwards
        listItem(itemPath, function(err, info) {
          if (err) {
            reject(err);
            return callback(err);
          }
          if (info.type == "FILE") {
            loadFile(info);
          }
          else {
            // Return the folder directly
            callback(null, info, null);
            resolve(info);
          }
        }, false);
      }
      else {
        /*

          Please remember that this loops trough every part of the path because it's not possible to go directly to a unix path using icloud apis. Therefore we need to look trough every folder on the way of an item. To avoid double requests, this method uses a cache

        */

        // The requested path
        var pathList = itemPath.split("/").filter(item => item != "");
        // The first item of the requested path that will be used has the index 0
        var pathLength = 0;
        // This is the root path, every document has to be added to
        var root = "FOLDER::com.apple.CloudDocs";
        // This is the first request path
        var path = root + "::root";
        // The first targetItem is the first item of the requested path
        var targetItem = pathList[pathLength];

        // Start the loop
        listItem(path, itemHandle, useCache);
      }
      // Handle every listed item
      function itemHandle(err, item, eventsEnabled = true) {
        if (err) {
          reject(err);
          return callback(err);
        }
        // itemList is the list of childs
        var itemList = item.items;
        // If we're actually handling the last item of the pasth list, this has to be the searched item (It also has to be folder because if we search for a file, the itemFound() is just fired before by handlimng its parent folder)
        if (pathLength >= pathList.length) {
          return itemFound(item);
        }
        else if (eventsEnabled) {
          // If the current folder is not the searched one, fire an 'progress' event
          self.emit("progress", {
            parentAction: "getItems",
            action: "listItem",
            searchedItem: itemPath,
            currItem: "/" + pathList.slice(0, pathLength).join("/"),
            progress: (pathLength + 1) / (pathList.length + 1)
          });
        }
        // Loop trough the childs of the current item (always a folder)
        for (var i = 0; i < itemList.length; i++) {
          // Set the name of the current children with extension
          var currName = itemList[i].name + (itemList[i].extension ? ("." + itemList[i].extension) : "");
          // Wether the current name is the same as the targetName (target name is tbe current searched item name)
          if (currName == targetItem) {
            // Check wether the currnet item is a folder, then we have to request it's informations again to get it's children
            if (isFolder(itemList[i])) {
              // Set new path to current item's complete drivewsid (Valid iCloud-Drive API path)
              path = itemList[i].drivewsid;
              // Add 1 to pathLength to prepare for the next pass
              pathLength++;
              // Set new targetItem to the new item with the index of the new pathLength
              targetItem = pathList[pathLength];
              // List the current folder again
              listItem(path, itemHandle, useCache);
            }
            else if (itemList[i].type === "FILE") {
              // Wether the current item is a file, it has to be the searched one
              loadFile(itemList[i]);
            }
            return;
          }
        }
        // No item in current folder of loop founded that equals to the required one by path.
        // Searched item seems to be non-existing
        var errObj = {
          success: false,
          error: "No such file or directory",
          searchedItem: itemPath,
          errorCode: 2
        };
        reject(errObj);
        callback(errObj);

      }
      function itemFound(result, stream = null) {
        result = deleteSpamInfo(result);
        if ("items" in result) {
          result.items = result.items.map(function(item) {
            item = deleteSpamInfo(item);
            return item;
          });
        }
        function deleteSpamInfo(obj) {
          delete obj.zone;
          delete obj.parentId;
          //delete obj.etag;
          //delete obj.drivewsid;
          delete obj.numberOfItems;
          return obj;
        }
        resolve(result);
        callback(null, result, stream);
      }


      function listItem(drivewsid, callback, useCache = true) {
        if (drivewsid in self.Drive.folderCache && useCache) {
          callback(null, self.Drive.folderCache[drivewsid], false);
          return;
        }

        var content = JSON.stringify([
          {
            "drivewsid": drivewsid,
            "partialData": false
          }
        ]);
        var host = getHostFromWebservice(self.account.webservices.drivews);
        request.post("https://" + host + "/retrieveItemDetailsInFolders?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientId=" + self.clientId + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&dsid=" + self.account.dsInfo.dsid, {
          headers: fillDefaults({
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies),
            'Content-Length': content.length
          }, self.clientSettings.defaultHeaders),
          body: content
        }, function(err, response, body) {
          if (err) return callback(err);
          var result = JSON.parse(body);
          if (0 in result) {
            self.Drive.folderCache[result[0].drivewsid] = result[0];
            callback(null, result[0]);
          }
          else {
            callback(result);
          }
        });
      }
      function loadFile(file) {
        var host = getHostFromWebservice(self.account.webservices.docws);
        var url = "https://" + host + "/ws/com.apple.CloudDocs/download/by_id?document_id=" + file.docwsid + "&token=" + self.auth.token + "&clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid;
        request.get(url, {
          headers: fillDefaults({
            'Host': host,
            'Cookie': cookiesToStr(self.auth.cookies)
          }, self.clientSettings.defaultHeaders)
        }, function(err, response, body) {
          if (err) return callback(err);
          file.contents = JSON.parse(body);

          itemFound(file);
        });
      }
    });




    return filePromise;
  },
  createFolders(destination, folders, callback = function() {}, useCache = true) {
    var self = this;
    // If folders arg is a string, put as a single item into an array
    if (typeof folders === "string") {
      folders = [folders];
    }

    var createPromise = new Promise(function(resolve, reject) {
      // Get destination information
      self.Drive.getItem(destination, function(err, item) {
        if (err) {
          reject(err);
          return callback(err);
        }
        var host = getHostFromWebservice(self.account.webservices.drivews);
        if (isFolder(item)) {
          var content = JSON.stringify({
            "destinationDrivewsId": item.drivewsid,
            "folders": folders.map(function(folderName) {
              return {
                "clientId": self.clientId,
                "name": folderName
              }
            })
          });

          request.post("https://" + host + "/createFolders?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid, {
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
        }
      }, useCache);
    });

    return createPromise;
  },
  deleteItems(items, callback = function() {}, useCache = true) {
    var self = this;

    // If folders arg is a string, put as a single item into an array
    if (typeof items === "string") {
      items = [items];
    }
    var host = getHostFromWebservice(self.account.webservices.drivews);
    var content = {
      "items": []
    };

    var deletePromise = new Promise(function(resolve, reject) {
      items.forEach(function(currItem, index) {
        self.Drive.getItem(currItem, function(err, itemInfo) {
          if (err) {
            reject(err);
            return callback(err);
          }
          content.items.push({
            "drivewsid": itemInfo.drivewsid,
            "etag": itemInfo.etag
          });
          // If last item of item's list is reached
          if (index >= items.length - 1) {
            // Last item
            content = JSON.stringify(content);
            request.post("https://" + host + "/deleteItems?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid, {
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
              callback(err, result);
            });
          }
        }, useCache);
      });
    });


    return deletePromise;
  },
  renameItems(items, callback = function() {}, useCache = true) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.drivews);

    var content = {
      "items": []
    };
    var renamePromise = new Promise(function(resolve, reject) {
      Object.keys(items).forEach(function(itemPath, index) {
        var name = items[itemPath].split(".");
        self.Drive.getItem(itemPath, function(err, itemInfo) {
          if (err) {
            reject(err);
            return callback(err);
          }
          content.items.push({
            "drivewsid": itemInfo.drivewsid,
            "etag": itemInfo.etag,
            "name": name[0],
            "extension": name[1]
          });
          if (index >= Object.keys(items).length - 1) {
            content = JSON.stringify(content);
            request.post("https://" + host + "/renameItems?clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=" + self.clientId + "&dsid=" + self.account.dsInfo.dsid, {
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
              resolve(result);
              callback(null, result);
            });
          }
        }, useCache);
      });
    });

    return renamePromise;
  },
  upload(file, callback) {
    var self = this;

    var host = getHostFromWebservice(self.account.webservices.docws);
    var content = JSON.stringify({
      "filename": "file.txt",
      "type": "FILE",
      "content_type": "text/plain",
      "size": 15
    });

    request.post("https://" + host + "/ws/com.apple.CloudDocs/upload/web?token=NONE&clientBuildNumber=" + self.clientSettings.clientBuildNumber + "&clientMasteringNumber=" + self.clientSettings.clientMasteringNumber + "&clientId=1356E574-A2A4-415F-A028-1BC2FB56FFB3&dsid=11298614181", {
      headers: fillDefaults({
        'Host': host,
        'Cookie': cookiesToStr(self.auth.cookies),
        'Content-Length': content.length
      }, self.clientSettings.defaultHeaders),
      body: content
    }, function(err, response, body) {
      if (err) return callback(err);
      var result = JSON.parse(body);
      console.log(result);
      var content = '------WebKitFormBoundaryeKzg6g4kckug2g31\r\nContent-Disposition: form-data; name="files"; filename="file.txt"\r\nContent-Type: text/plain\r\n\r\n\r\n------WebKitFormBoundaryeKzg6g4kckug2g31--\r\n';
      var req = request.post(result[0].url, {
        headers: fillDefaults({
          'Host': host,
          'Cookie': cookiesToStr(self.auth.cookies),
          'Content-Length': content.length
        }, self.clientSettings.defaultHeaders),
        body: content
      }, function(err, response, body) {
        if (err) return callback(err);
        var result = JSON.parse(body);
        console.log(result);
      });
      var form = req.form();
      form.append('file', fs.readFileSync(file), {
        filename: 'file.txt',
        contentType: 'text/plain'
      });
      //form.append('files', fs.createReadStream(file));
      //console.log(fs.readFileSync(file));
    });

    //var form = req.form();
    //form.append('file', fs.createReadStream(file));
  }
}
