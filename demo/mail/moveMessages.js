// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const folders = await myCloud.Mail.getFolders();

  const messages = (await myCloud.Mail.listMessages(folders[0], 1, 50)).messages;

  console.log("Moving first message into '" + folders[1].name + "'...");

  var movementChangset = await myCloud.Mail.move([
    messages[0], // The messages have to be in the same folder!
    //myMessages[1] // Otherwise an error will occur!
  ], folders[1]);

  console.log(movementChangset);
})();
