// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  var events = await myCloud.Calendar.getEvents("2018-11-01", "2018-11-30");

  console.log(events);
})();
