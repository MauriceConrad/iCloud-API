// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require("../prompt-credentials");

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  const groupName = 'my-new-group-1';
  const contactFirstName = 'Allice';

  const { contacts, groups } = await myCloud.Contacts.list();

  const group = groups.find(x => x.name === groupName);
  const contact = contacts.find(x => x.firstName === contactFirstName);

  if (!group) throw new Error('could not find group ' + groupName);
  if (!contact) throw new Error('could not find contact ' + contactName);

  console.log(`Adding ${contact.firstName} to ${group.name}`)

  // magic
  group.contactIds.push(contact.contactId);
  const changeset = await myCloud.Contacts.changeGroups(group);

  console.log("Changeset: ", changeset);
})();
