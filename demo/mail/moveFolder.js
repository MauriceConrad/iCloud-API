// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const folders = await myCloud.Mail.getFolders();

  const customFolders = folders.filter(folder => folder.role == "FOLDER");

  if (customFolders.length >= 2) {
    console.log("Move '" + customFolders[0].name + "' into '" + customFolders[1].name + "'...");

    const movementChangeset = await myCloud.Mail.moveFolder(customFolders[0], customFolders[1]);

    console.log(movementChangeset);
  }
  else {
    console.error("You need at least two custom folders to move the first into the second one.");
  }
})();
