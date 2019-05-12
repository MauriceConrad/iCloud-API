// Require function that already logs in and asks for the credentials if needed
const promptiCloud = require('../prompt-credentials');

(async () => {
  // Login to icloud and ask for new credentials if needed
  const myCloud = await promptiCloud();

  // specify groups to delete
  const groupNames = ['my-new-group-1', 'my-new-group-2'];

  // must call list at least once to get sync token
  const { groups: existingGroups } = await myCloud.Contacts.list();
  const groups = [];
  groupNames.forEach(groupName => {
    const group = existingGroups.find(x => x.name === groupName);
    if (!group) throw new Error(`Could not find group ${groupName}`);

    groups.push(group);
  })

  console.log(`Deleting contact groups (${groups.map(x => x.name)})...`);

  // Promise
  const newChangeset = await myCloud.Contacts.deleteGroups(groups);

  console.log('Changeset:', newChangeset);
})();
