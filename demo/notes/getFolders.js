// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // Get all notes without callback because we handle it only with "progress" event
  myCloud.Notes.getAll();

  // Handler
  myCloud.on("progress", function(event) {
    // Relate to the 'getAll()' method
    if (event.parentAction === "getAll") {
      // The 'zone' object is not important. Important are the 'records' within it
      // These records are new and may contain Notes or Folders
      // What they are actually containing is described in their object structure

      // Here you can have a look at every record's 'parent' property and when the parent folder isn't loaded as record, you can load it manually with 'getFolders()' because it accepts also 'recordName' as arguments

      // What we are doing here is JUST an example. As you can see, firstly we get notes from 'getAll()' method and secondly we call 'getFolders()' to all of these notes.
      // This is just to demonstrate the method 'getFolders()' and the difference to 'getAll()'. 'getFolders()' gets folders directly if you know their object literal or just their 'recordName' !

      // 'getFolders()' can be useful when you are using 'getAll()' and you know a Note record already and its 'parentFolder' property describes a folder you actually don't know.
      // But because of the 'parentFolder' property of the note, you know the 'recordName' of the folder. Now, you can request the folder directly and you don't have to wait, that the folder comes as record from 'getAll()'


      for (let noteRecord of event.zone.records.filter(record => record.recordType == "Note")) {
        console.log("Getting current note's parent folder...");
        myCloud.Notes.getFolders([ // Can also be a single folder object or a single 'recordName' string if it's only one
          noteRecord.parent
        ], function(err, folders) {
          // If an error occurs
          if (err) return console.error(err);
          // Array with your folder's data
          console.log(require('util').inspect(folders, { depth: null }));
        });
      }

    }
  });


})();
