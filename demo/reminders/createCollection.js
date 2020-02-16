// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  console.log("Creating new collection 'My new collection' with symblic color 'green'...");

  const createChangeset = await myCloud.Reminders.createCollection({
    title: "My new collection",
    symbolicColor: "green" // Default 'auto'
  });

  console.log(createChangeset);

})();
