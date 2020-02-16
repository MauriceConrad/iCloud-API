// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // Get all notes
  myCloud.Notes.getAll(function(err, folders) {
    // If an error occurs
    if (err) return console.error(err);
    // Your folders containing the notes
    //console.log(folders);
  });
  myCloud.on("progress", function(event) {
    // Relate to the 'getAll()' method
    if (event.parentAction === "getAll") {
      // The 'zone' object is not important. Important are the 'records' within it
      // These records are new and may contain Notes or Folders
      // What they are actually containing is described in their object structure
      console.log(event.zone.records);
      // Here you can have a look at every record's 'parent' property and when the parent folder is not loaded as record, you can load it manually with 'getFolders()' because it accepts also 'recordName' as arguments
    }
  });
})();
