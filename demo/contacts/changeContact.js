// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  await myCloud.Contacts.list();

  var contactsData = await myCloud.Contacts.list();

  var firstContact = contactsData.contacts[0];

  console.log("Changing first contact's(" + firstContact.firstName + " " + firstContact.lastName + ") last name to " + "'NewLastName'...");

  firstContact.lastName = "NewLastName2";

  var changeset = await myCloud.Contacts.change(firstContact);

  console.log("Changeset: ", changeset);
})();
