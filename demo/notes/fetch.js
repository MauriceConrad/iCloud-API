// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // Get all notes
  const notes = myCloud.Notes.fetch();

  var done = false;

  notes.on("data", zone => {

    console.log("Fetched: " + notes.__folders.length + " folders; " + notes.__notes.length + " notes");

    // Log folders structured
    console.log(notes.folders);

  });


})();
