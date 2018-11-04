// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  var createChangeset = await myCloud.Calendar.createCollection({
    // Properties for your collection (Everything like id's will be calculated automatically)
    title: "My Collection!", // The name of the collection
    color: "#c4ff70" // The color that will be displayed in iCloud clients and represent the collection (Optional default is #ff2d55)
  });

  console.log(createChangeset);
})();
