// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // Get all notes
  const notes = myCloud.Notes.fetch();

  var done = false;

  notes.on("data", async zone => {

    console.log("Fetched: " + notes.__folders.length + " folders; " + notes.__notes.length + " notes");

    // If at least 1 folder is known
    if (notes.folders.length > 0) {
      // Select the folder
      const myFolder = notes.folders[0];
      // Select the note we want to resolve()
      const myNote = myFolder.notes[0];

      // Get note detailed
      const myNoteDetailed = (await myCloud.Notes.resolve(myNote))[0];

      console.log(myNoteDetailed);

    }

  });


})();
