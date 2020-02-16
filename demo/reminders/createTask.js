// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  console.log("Creating task 'I have to do this!' with priority 1...");

  const createChangeset = await myCloud.Reminders.createTask({
    title: "I have to do this!",
    pGuid: "tasks", // The 'guid' of a collection you got from ('getOpenTasks()' || 'getCompletedTasks')
    priority: 1, // 1 is "High", 5 is "Medium" & 9 is "Low",
    description: "This describes my task perfectly!"
  });

  console.log(createChangeset);

})();
