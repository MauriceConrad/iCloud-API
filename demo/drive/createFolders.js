// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  console.log("Creating new folder 'this folder is new' at '/'...");

  var createChangeset = await myCloud.Drive.createFolders("/", ["this folder is new"]);

  console.log(createChangeset);

})();
