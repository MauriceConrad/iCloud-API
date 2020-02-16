// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  var events = await myCloud.Calendar.getEvents("2018-11-01", "2018-11-30");

  const deletingEvent = events[0];

  console.log("Delete " + deletingEvent.title + " event...");

  if (deletingEvent) {
    // 2nd argument defines wether all recurring events should be deleted
    var deleteChangeset = await myCloud.Calendar.deleteEvent(events[0], false);

    console.log(deleteChangeset);
  }
  console.error("No date found in the given time area");
})();
