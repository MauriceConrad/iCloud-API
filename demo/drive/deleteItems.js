// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const rootInfo = await myCloud.Drive.getItem("FOLDER::com.apple.CloudDocs::root");

  const deletionFile = rootInfo.items.find(item => item.type === "FILE");

  console.log("Deleting " + deletionFile.name + "." + deletionFile.extension + "...");


  var deleteChangeset = await myCloud.Drive.deleteItems([
    deletionFile.drivewsid
  ]);

  console.log(deleteChangeset);

})();
