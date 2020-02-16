// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require('../prompt-credentials');

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // specify groups to create
  const groupNames = ['my-new-group-1', 'my-new-group-2'];
  console.log(`Creating new contact group (${groupNames})...`);

  // list contacts to get sync token
  await myCloud.Contacts.list();

  // Promise
  const groups = groupNames.map(x => ({ name: x }));
  const newChangeset = await myCloud.Contacts.newGroups(groups);

  console.log('Changeset:', newChangeset);
})();
