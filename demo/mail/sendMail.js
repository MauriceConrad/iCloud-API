// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const sendResult = await myCloud.Mail.send({
    //from: "Your Name<your.address@icloud.com>", If not given, your address will be found automatically
    to: "conr.maur@googlemail.com", // Required
    subject: "Your API",
    body: "<strong>Hey Maurice,</strong><br><br>I totally love your <i>API</i>. Of course it's not perfect but <strong>I love it</strong>", // HTML string
    attachments: [ // Optional
      // Your attachments
      // Not implemented yet
      // Coming soon
    ]
  });

  console.log(sendResult);
})();
