// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const collectionsWithOpenTasks = await myCloud.Reminders.getOpenTasks();

  const myTask = collectionsWithOpenTasks[0].tasks[0];

  if (myTask) {
    console.log("Complete task '" + myTask.title + "'...");

    const completedChangeset = await myCloud.Reminders.completeTask(myTask);

    console.log(completedChangeset);
  }
  else {
    console.error("No open task found within in the first collection that could be completed.");
  }

})();
