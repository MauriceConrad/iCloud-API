// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const folders = await myCloud.Mail.getFolders();

  const messagesData = await myCloud.Mail.listMessages(folders[0], 1, 50);

  console.log("Getting first message's details...");

  const myMessageDetailed = await myCloud.Mail.getMessage(messagesData.messages[0]);

  console.log(myMessageDetailed);
})();
