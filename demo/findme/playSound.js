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
  const myPhone = devices.content[0];

  console.log("Playing sound on " + myPhone.name + "...");

  try {
    const res = await myCloud.FindMe.playSound(myPhone.id);

    console.log("Successfully played sound!");
  } catch (e) {
    console.error(e);
  }
})();
