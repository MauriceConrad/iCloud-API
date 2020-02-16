// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  console.log("Creating folder 'My new folder' at top level...");

  const createChangeset = await myCloud.Mail.createFolder({
    name: "My new folder", // Default null
    parent: null // Can be a folder object or a guid string (Default null)
  });

  console.log(createChangeset);
})();
