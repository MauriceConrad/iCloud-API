// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const collectionsWithOpenTasks = await myCloud.Reminders.getOpenTasks();

  const collectionToDelete = collectionsWithOpenTasks[1];

  if (collectionToDelete) {
    console.log("Deleting collection '" + collectionToDelete.title + "'...");

    const deletionChangeset = await myCloud.Reminders.deleteCollection(collectionToDelete);

    console.log(deletionChangeset);
  }
  else {
    console.error("No custom collection found that could be deleted...");
  }

})();
