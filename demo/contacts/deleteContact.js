// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  await myCloud.Contacts.list();

  var contactsData = await myCloud.Contacts.list();

  // Use the first contact
  var myContactIDontLike = contactsData.contacts[0];

  console.log("Deleting first contact(" + myContactIDontLike.firstName + " " + myContactIDontLike.lastName + ")...");

  // Attention! This will delete the first contact!
  var delChangeset = await myCloud.Contacts.delete(myContactIDontLike);

  console.log("Deleteing Changeset:", delChangeset);
})();
