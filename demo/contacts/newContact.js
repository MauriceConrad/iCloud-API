// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  console.log("Creating new contact (Maurice Conrad)...");

  await myCloud.Contacts.list();

  // Promise
  var newChangeset = await myCloud.Contacts.new({
    firstName: 'Maurice',
    lastName: 'Conrad',
    emailAddresses: [
      {
        label: "Privat",
        field: "conr.maur@googlemail.com"
      }
    ],
    isCompany: false,
  });

  console.log("Changeset:", newChangeset);
})();
