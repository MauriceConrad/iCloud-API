// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  try {
    var devices = await myCloud.FindMe.get();
  }
  catch (e) {
    console.error(e);
  }
  console.log(devices);
})();
