// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  var createChangeset = await myCloud.Calendar.createEvent({
    title: "Best Event ever", // Required
    location: "Mainz am Rhein", // Optional
    description: "This is the best description ever", // Optional
    url: "https://maurice-conrad.eu", // Optional
    pGuid: "home", // 'guid' of collection
    alarms: [ // Lists all alarms (Optional)
      {
        before: true,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 35,
        seconds: 0
      }
    ],
    // Describes the rule to repeat the event
    recurrence: {
      count: 3, // How many times the event will be repeated (Optional, default is Infinity)
      freq: "daily", // Type of frequence (e.g. 'daily', 'weekly')
      interval: 10 // Interval for frequence
    },
    startDate: new Date("2018-11-05 12:00"), // UTC Time is required from local, therefore the event start time means your local 12:00)
    endDate: new Date("2018-11-05 13:00") // Same here
  });

  console.log(createChangeset);
})();
