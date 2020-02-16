// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const folders = await myCloud.Mail.getFolders();

  const userCustomFolder = folders.find(folder => folder.role == "FOLDER");

  if (userCustomFolder) {
    console.log("Deleting '" + userCustomFolder.name + "'...");
    
    const deleteChangeset = await myCloud.Mail.deleteFolder(userCustomFolder);

    console.log(deleteChangeset);
  }
  else {
    console.error("No custom user folder found that could be deleted.");
  }
})();
