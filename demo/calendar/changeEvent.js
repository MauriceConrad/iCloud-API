// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  var events = await myCloud.Calendar.getEvents("2018-11-01", "2018-11-30");


  const changingEvent = events[0];

  console.log("Changing " + changingEvent.title + " event's location to 'Mainz am Rhein'...");

  if (changingEvent) {
    changingEvent.location = "Mainz am Rhein";

    // 2nd argument: true - If you want to change all recurred events ('recurrence') (Default is false)
    var changeset = await myCloud.Calendar.changeEvent(changingEvent, true);

    console.log(changeset);
  }
  else {
    console.error("No date found in the given time area");
  }

})();
