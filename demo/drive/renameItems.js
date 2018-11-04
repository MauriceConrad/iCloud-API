// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const rootInfo = await myCloud.Drive.getItem("FOLDER::com.apple.CloudDocs::root");

  const firstFile = rootInfo.items.find(item => item.type === "FILE");

  console.log("Renaming " + firstFile.name + "." + firstFile.extension + " to 'new_name." + firstFile.extension + "'...");

  var renameChangeset = await myCloud.Drive.renameItems({
    [firstFile.drivewsid]: "new name." + firstFile.extension,
    //"Oh/another/item.txt": "renamed.txt" // Of course you can use a drivewsid
  });

  console.log(renameChangeset);

})();
