// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const collectionsWithOpenTasks = await myCloud.Reminders.getOpenTasks();

  if (collectionsWithOpenTasks[0]) {
    console.log("Setting collection '" + collectionsWithOpenTasks[0].title + "'s symbolic color to 'red'");

    collectionsWithOpenTasks[0].symbolicColor = "red";

    const changeset = await myCloud.Reminders.changeCollection(collectionsWithOpenTasks[0]);

    console.log(changeset);
  }
  else {
    console.error("No collection found with at least one open task...");
  }

})();
