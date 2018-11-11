# iCloud API

This is an unofficial iCloud API that provides useful methods to interact with some services of iCloud.

## Attention

Please make sure that this API is my private work and therefore it will never be supported by Apple. iCloud's endpoints and functionality can be changed every time by Apple. Using this project is on your risk and it's possible that apple bans your account. They can do whatever they want and because of the fact that it doesn't fits in to Apples agreements, I can not ensure using this API without risks.

The API's I've implemented are more less the same as Apple provides. Sometimes, the objects are simplified or a little bit restructured because the requirements of such a Javascript API are different from the original API Apple provides. But all in all it's Apple's data and I'm not the author of the idea how an API's result works in detail.

I can not be sure that Apple does not provide any kind of changes in their API. That means, it is possible that something does not work as expected although you did it as it is described in the *Documentation* here.

## Installation

```bash
npm install apple-icloud
```

## Getting Started

```javascript
// Require the module
const iCloud = require('apple-icloud');

var session = {}; // An empty session. Has to be a session object or file path that points on a JSON file containing your session
var username = "my.account@mail.com"; // Your apple id
var password = "totally-save-password"; // Your password

// This creates your iCloud instance
var myCloud = new iCloud(session, username, password);

myCloud.on("ready", function() {
  // This event fires when your session is ready to use. If you used a valid session as argument, it will be fired directly after calling 'new iCloud()' but sometimes your session is invalid and the constructor has to re-login your account. In this case this event will be fired after the time that is needed to login your account.
});
```

### Session broken

Basically, your instance always tries to use an existing session. You can pass a session by an object or a file path that points to a JSOn file. If the passed session is invalid because of any reason, your instance will use your given credentials to re-login. If you did not gave any credentials to the constructor, your instance will try to get the credentials from the given (and obviously broken) session that are normally stored within.

```javascript
// This creates your iCloud instance
var myCloud = new iCloud("path/to/my/session.json", username, password);
```
This way is more practicable because it does a lot of stuff automatically. E.g. if your session is too old or invalid, this method just creates a new one.
If you use this way of logging in, you will be save that everything works fine. Therefore that is the recommended way.

Now you have a working session and you should continue at [API](#API)

### Instance Call

I already explained that the way I use, is the recommended one but theoretically you can do everything manually.

The arguments I use here are all optional but if you don't use them you have to initialize your instance manually. That is possible but not easy as the way above with only three arguments.


### Detailed Way (Not Recommended)

#### Login manually

As I already explained, you can do everything manually.

```javascript
// This creates your iCloud instance without any arguments
var myCloud = new iCloud();

// This creates a new session with your credentials. This is very slow if you do it every time and also not recommended because apple bans your account if you login too often in a small time area
myCloud.login(username, password, function(err) {
  if (err) {
    // An error occured
  }
  // You logged in successfully!
});
```

This is maybe interesting if you have an existing session but you want to re-login your account because of some reason I don't know. But please keep in mind that you really **should** use existing sessions much as possible because you save a lot of time and avoid being banned by Apple.

### Export Session

If you have an existing session, you can export it just calling `exportSession()` in iCloud instance. This returns a session object that can be loaded the next time you create an iCloud instance `new iCloud(session, username, password)`.

```javascript
var newSession = myCloud.exportSession();
```

#### Save Session

Your iCloud instance (`myCloud`) also contains a method called `saveSession` that saves the session directly to a file path.

```javascript
myCloud.saveSession("/path/to/my/session.json");
```

If you don't put a file path as argument, the method will use the path you used with `new iCloud(path, username, password)`. If you did not used such a file path there, an error occurs. In practise, that means you can do the following successfully:

```javascript
var myCloud = new iCloud("path/to/my/session.json", username, password);

/*
  Do your cool stuff.
*/

// Saves session to 'path/to/my/session.json' because your instance knows this path already and you used no custom one as argument
myCloud.saveSession();
```

#### Save Session automatically

To save the session automatically when something changes, just listen to the `sessionUpdate` event and apply `saveSession()`.

```javascript
myCloud.on("sessionUpdate", function() {
  myCloud.saveSession();
});
```

## IMPORTANT

**Please**. Save your sessions and use them often as possible. This avoids problems with the API. If you do not use session saving, your client has to do the complete login process every time you start your script. This takes a lot of time and destroys functionality on Apples's servers because they may stop sending important cookies. Therefore: **Just do it.**

## Two Factor Authentication

If the *two-factor-authentication* is required, your login works basically as expected. You get the `ready` event on your instance and so on.
**But** you cannot use the most API's such as `Contacts`, `Mail`, `Notes` and so on unless you type in the *security code*. The only API's that are available are the ones that are also available on `iCloud.com` without typing in a security code, such as `FindMe`.

### Check for Two Factor Authentication

To check wether the *two-factor-authentication* is required, you can do **2** things.

1. Listen to the `err` event and check the error with the error code `15` and the message `Two-factor-authentication is required.`.
2. Check the boolean variable `twoFactorAuthenticationIsRequired` of your iCloud instance.

```javascript
// ... Logged in successfully

const needsSecurityCode = myCloud.twoFactorAuthenticationIsRequired;

if (needsSecurityCode) {
  console.error("Two Factor Authentication is required. Type in your security code!");
}
else {
  console.log("Everything okay. Go on!");
}
```

### Type in Security Code

To enable the other API's, you need to type in a security code that will be displayed on your devices.

```javascript
// Sample code '123456'
myCloud.securityCode = "123456";

// When finished, a `ready` event will be triggered.
myCloud.on("ready", function() {
  // Ready event
});
```

Of course, the `ready` event now will fire the second time because it already fired after first login (This returned the requirement of *two-factor-authentication*). To check wether the code is typed in now, look up the `twoFactorAuthenticationIsRequired` property that returns wether you need the security code (Should be `false` after you passed in a security code, otherwise the code seems to be invalid).

### Example

Everything sounds complicated?

No problem, just look at this short example for a login that supports *two-factor-authentication*. (Please keep in mind, that I am using `prompt` here, to get user's input. Of course, you can get your *security code* as you want).

```javascript
// ...
// 'username' & 'password' are defined here...

// This creates your iCloud instance
var myCloud = new iCloud("icloud-session.json", username, password);

myCloud.on("ready", function() {
  console.log("Ready Event!");
  // Check if the two-factor-authentication is required
  if (myCloud.twoFactorAuthenticationIsRequired) {
    // Get the security code using node-prompt
    prompt.get(["Security Code"], async function(err, input) {
      if (err) return console.error(err);
      const code = input["Security Code"];
      // Set the security code to the instance
      myCloud.securityCode = code;
    });
  }
  else {
    // Now the 'ready' event fired but 'twoFactorAuthenticationIsRequired' is false, which means we don't need it (anymore)
    console.log("You are logged in completely!");
  }
});
```

### Send Security Code Manually

When you are trying to login but *two-factor-authentication* is required, a *security code* will normally be sent to your devices automatically.

But sometimes, you need a new one, an *SMS* or a *voice call*. To request this programmatically, the API provides the method `sendSecurityCode(mode)` that sends a security code to your devices directly, via *SMS* or via *Voice* (phone call).

There exist 3 `mode`'s. If you don't set a `mode`, the default one is `message`.
1. `message` -> Sends a *security code* directly to your devices
2. `sms` -> Sends an SMS containing a *security code* to your phone
3. `voice` -> Calls your phone and speaks out a *security code*

Of course, the SMS will be sent to the phone number connected with your AppleID...

```javascript
// Request SMS security code
myCloud.sendSecurityCode("sms");

// Request voice security code
myCloud.sendSecurityCode("voice");
```

### Troubleshooting

Sometimes you run your script & give your credentials but no security code comes in?
This mostly happens because you set up a session that is partial completed but not fully complete. Try to delete your existing session file and try it again.

Also try to not wonder why you do not have to type in a security code a second time after using `test.js` or any other test envioreemnt. They save your session at `/tmp/icloud-session.json`. If you use it a second time, it just uses the old session.


## Applications

This is the basic iCloud API that you can use to interact with iCloud services.

* [Contacts](#contacts)
* [Friends](#friends)
* [Drive](#icloud--drive)
* [Calendar](#calendar)
* [Photos](#photos)
* [Find Me](#find-me)
* [Reminders](#reminders)
* [Mail](#mail)
* [Notes](#notes)


### Contacts

#### List

This method lists your account contacts data like groups and persons.

```javascript
myCloud.Calendar.list(function(err, data) {
  if (err) return console.error(err);
  // Successfully your contacts :)
  console.log(data);
});
```

**Demo:** `demo/contacts/listContacts.js`

#### IMPORTANT

To use `change()`, `new()` & `delete()` you firstly have to `list()` the contacts one time to become a valid `syncToken`!

#### Change

To change a contact's properties, just change the object's properties and call `change(myContact)`.

```javascript
myContact.lastName = "NewLastName";

const changeset = await myCloud.Contacts.change(myContact);
```

**Demo:** `demo/contacts/changeContact.js`

#### Delete

Deleting a contact is also easy like changing. Just use a contact's object as argument when calling `delete()`

```javascript
const delChangeset = await myCloud.Contacts.delete(myContactIDontLike);
```

**Demo:** `demo/contacts/deleteContact.js`

#### New

Creating a new contact is also really simple. You put a self-made contact-object as argument to `new()`. What a kind of properties a contact can have, is Apples work and this API just use apples JSON structures. If you need to know it, just loadan existing contact and have a look at it's object structure.

```javascript
const createChangeset = await myCloud.Contacts.new({
  firstName: 'New',
  lastName: 'Guy',
  emailAddresses: [
    {
      label: "Privat",
      field: "the.mail.address@mail.com"
    }
  ],
  isCompany: false
});
```

**Demo:** `demo/contacts/newContact.js`

### Friends

```javascript
const locations = await myCloud.Friends.getLocations();
```

Please also remember that the fist requests maybe doesn't returns a position for the devices (Same thing when using *FindMe*) because the position is still in progress. Sometimes you have to wait a few seconds.

**Demo:** `demo/friends/getLocations.js`


### iCloud Drive

The drive services are not completed yet.

This API is a little bit more complex because it implements a really useful implementation of unix paths in icloud. Please read the following paragraph to the end before using the API.


iCloud Drive's endpoints doesn't work with UNIX paths like */path/to/my/file*. But iCloud Drive use something called *drivewsid*. That is an id that points on your items in iCloud Drive.

If you list a folder, it returns the *drivewsid*'s of it's sub items. You can request them than.

The *drivewsid* of the root folder of iCloud Drive is `FOLDER::com.apple.CloudDocs::root`.

All methods of this API accept as first argument such a *drivewsid*.

#### Get Item

```javascript
const itemInfo = await myCloud.Drive.getItem("FOLDER::com.apple.CloudDocs::root");
```

**Demo:** `demo/drive/getItem.js`

#### Error?

May you see the error **"No PCS cookies"**. This is because you logged in to ofetn and icloud servers does not send them to you anymore or your actual session just does not have any PCS cookies. In any case, wait a few seconds up to minutes and reset your session. And **please** store your sessions! This will avoid such problems!

If you do his, you will see that you become a list with root's sub items and the related *drivewsid*'s. Theoretically you can work so.

#### Use UNIX file paths

But because I really like to use UNIX file paths directly I implemented a way that let you use them.
That means you can just use a UNIX file path instead of a *drivewsid* if you know the path to your item.

```javascript
const itemInfo = await myCloud.Drive.getItem("/myFolder/contains/my/nice/item.txt", undefined, true); // If using folder cache (Only necessary for UNIX paths) (Default is true)
```

##### Result

If you request a folder item, you get an array of the contained files within. But this array only contains general info about each file but not the whole contents. To get them, request the file seperetaly.

##### IMPORTANT

Because of the problem that my API hast to list every folder within the path of the requested item, this alernative is not very fast. For example if you request `/Folder1/SubFolder/Item.txt` the API hast to do 4 requests (*root*, *Folder1*, *SubFolder* & *Item.txt*).

But to speed it up, I implemented the possibility to cache everything. For example if you request `/Folder1/SubFolder/Item.txt`, every folder will be cached. Next time you request `/Folder1/SubFolder/Item 2.txt`, the folders on the *way* to `Item 2.txt` are not loaded again to speed it up. The **last** item in your path will ever be requested again each time. For example if you request `/Folder1/SubFolder` it needs 3 requests the first time (*root*, *Folder1* & *SubFolder*). Now, if you request again `/Folder1/SubFolder` the cache will only be used for *root* and *Folder1*. *SubFolder* is the target item you want and therefore it will be request again.

To avoid using the cache generally you can set the **third argument** to `false`. Default it is `true`.

This is just a feature, I have implemented and if you do not like it, just use the *docwsid*'s to request your data. That is much more *native* because iClouds internal API work in this way.

##### Result

How the strucuture of your requested item looks like, is the structure Apple created for their API's. In some cases I simplified some structures but all in all it's not my stuff.

To become an impression of such a result, just try it out :)

#### Rename Items

The renaming works really similar. It also accepts UNIX paths but also *docwsid*'s. The only difference is that it accepts a list with items.

```javascript
const changeset = await myCloud.Drive.renameItems({
  "/my/item/with/path.txt": "new name.txt", // Of course you can use a drivewsid
  "Oh/another/item.txt": "renamed.txt" // Of course you can use a drivewsid
}, undefined, true); // If using folder cache (Only necessary for UNIX paths) (Default is true)
```

But please remember that it can cost a lot of time when there many not cached folders on the way and you use UNIX paths.

**Demo:** `demo/drive/renameItems.js`


#### Delete Items

The same logic works when using `deleteItems()`. The only difference is that you don't use an object as argument but an array. Theoretically you can also use single string if you just have one item to delete.

```javascript
const delChangeset = await myCloud.Drive.deleteItems([
  "/Test/this folder is new",
  "/Test/this folder is also new"
], undefined, true); // If using folder cache (Only necessary for UNIX paths) (Default is true)
```

But please remember that it can cost a lot of time when there many not cached folders on the way and you use UNIX paths.

**Demo:** `demo/drive/deleteItems.js`

#### Create Folders

This method provides functionality to create multiple folders in one parent folder

```javascript
// 1st argument: '/Test' is the parent folder ( Can always be a 'drivewsid'! )
// 2nd argument: Array with new folders
const createChangeset = await myCloud.Drive.createFolders("/Test", ["this folder is new"], undefined, true); // If using folder cache (Only necessary for UNIX paths) (Default is true)
```

**Demo:** `demo/drive/createFolders.js`


#### Upload File

**Still in progress**

### Calendar

The iCloud Calendar services have a little bit more complicated structure. Therefore I restructured the original objects a little bit to make it easier to work with the event data. That means it is theoretically possible that Apple makes significant changes on their API that stop my methods working.

#### Get Collections

*Collection* means just the different groups of events such like 'Private' or 'Work'.
List your collections is a save way to know on which points you can define new events.
You do it like the following:

```javascript
const collections = await myCloud.Calendar.getCollections();
```

The structure of a collection is not so complicated, therefore I don't explain it detailed. Just have a look at it and try it out :)

**Demo:** `demo/calendar/getCollections.js`

#### Get Events

Please note that this maybe takes time because every event is requested for details one times. That's because the original Apple API returns the events not detailed if I request for an time area. I have to do another request for every event to get its detailed information. To get the progress of the complete method, just listen to *progress* event of your iCloud instance and have a look at `parentAction: 'getEvents'` and the related `progress`.

```javascript
// Get all events from the 7th July 2017 to 9th August 2017
const events = await myCloud.Calendar.getEvents("2017-07-15", "2017-08-09");
```

**Demo:** `demo/calendar/getEvents.js`

Please keep always in mind that the possibility of working with Javascript's Date objects within events when getting them or creating is my personal workaround to make handling the API more easy. Apple's internal way of handling dates is an array driven solution that is not native as a Date-Object literal. Because of that it can be theoretically possible that you get a property I forgot to parse into Javascript's Date-Object. THis property would look like an array...

An event contains a lot of properties such like `recurrence`, `alarms` which explains the rules for repeating the event in future or every alarms that will be triggered. Just have a look at these objects to understand it detailed. It's not so complicated ;-)


#### Create Collection

```javascript
const createChangeset = await myCloud.Calendar.createCollection({
  // Properties for your collection (Everything like id's will be calculated automatically)
  title: "Mein Kalendar 2!", // The name of the collection
  color: "#ffe070" // The color that will be displayed in iCloud clients and represent the collection (Optional default is #ff2d55)
});
```

A created **collection** gets a specific `guid` from Apple it will be identified with.

**Demo:** `demo/calendar/createCollection.js`

#### Create Event

Remember the same as you noticed for creating a contact. For creating a event, use the same object structure as you know from 'getEvents()'.

In this code example is not every possible property used. Everything that can be in a event you got, can also be here.


```javascript
const createChangeset = await myCloud.Calendar.createEvent({
  title: "Viele", // Required
  location: "My City", // Optional
  description: "This is the best description ever", // Optional
  url: "https://maurice-conrad.eu", // Optional
  pGuid: "home", // 'guid' of collection
  alarms: [ // Lists all alarms (Optional)
    {
      before: true,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 35,
      seconds: 0
    }
  ],
  recurrence: { // Describes the rule to repeat the event
    count: 3, // How many times the event will be repeated (Optional, default is Infinity)
    freq: "daily", // Type of frequence (e.g. 'daily', 'weekly')
    interval: 10 // Interval for frequence
  },
  startDate: new Date("2017-07-26 12:00"), // UTC Time is required from local, therefore the event start time means your local 12:00)
  endDate: new Date("2017-07-26 13:00") // Same here
});
```

Please keep always in mind that the possibility of working with Javascript's Date objects within events when getting them or creating is my personal workaround to make handling the API more easy. Apple's internal way of handling dates is an array driven solution that is not native as a Date-Object literal. Because of that it can be theoretically possible that you get a property I forgot to parse into Javascript's Date-Object. This property would look like an array...

**Demo:** `demo/calendar/createEvent.js`

##### Properties

Because the sepific properties to describe a task and its alarms, is part of Apple's internal API, I do not offer a documentation about this properties and their values because they can change every time.

To get an idea about the specific properties, try out some tasks and have a look at their objects literal using `getOpenTasks()` or `getCompletedTasks()`.
The API's are transmitted directly without changes except datetime data. I try to parse it all into **Date** objects, so you don't have to care about the internal way of transmitting datetimes.

An exception I made is `Recurrence` you see below. But always keep in mind that the sepific properties used here may not work later... But normally Apple will not change their API every 5 minutes ;-)

##### Recurrence

The `recurrence` object contains a few properties that control the exact type of recurring the event.
These properties are

```javascript
{
  freq: "daily", // 'daily' || 'weekly', || 'monthly', 'yearly'
  count: null, // Count of recurring events, Default: Infinity for a never ending recurrence
  interval: 1, // Interval of frequency  
  byDay: null,
  byMonth: null,
  until: [Date], // Exact date on which the recurrence should be stopped
  frequencyDays: null,
  weekDays: null
}
```

The properties `count` & `until` contradict each other. *Just use one of them to describe the recurrence.*


#### Delete Event

```javascript
// 'myEventIDontLike' is just an event object you got from 'getEvents()'

// 2nd argument: true - If you want to delete all recurred events ('recurrence') (Default is false)
const delChangeset = await myCloud.Calendar.deleteEvent(myEventIDontLike, true);
```

If you want to delete **all** recurring events after one special event, just set the 2nd argument to `true`. This will **not** delete all events before the event you set as 1st argument but all of the same type *after* it.

For example, if you have an event that starts at 7th of July and will be recurred every day and you want to delete all recurring events after the 10th of July, you have to use the event object of 10th of July as 1st argument and set the 2nd argument to `true`. This will delete all events of this type since the 10th of July but not the events *before* the 10th of July.

**Demo:** `demo/calendar/deleteEvent.js`

#### Change Event

```javascript
// 'myEvent' is just an event object you got from 'getEvents()'
myEvent.location = "This place is much better";
// 2nd argument: true - If you want to change all recurred events ('recurrence') (Default is false)
const changeset = await myCloud.Calendar.changeEvent(myEvent, true);
```

**Demo:** `demo/calendar/changeEvent.js`

### Photos

#### Get Photos

Please make sure that this service needs *PCS-Cookies*. Sometimes they aren't there because of some security aspects of iCloud (e.g. You take too many logins in a small time area). Don't care about this normally, just keep it in mind when something doesn't work as expected.

```javascript
const images = await myCloud.Photos.get();
```

**Demo:** `demo/photos/getPhotos.js`

#### Upload Photo

**Still in progress**

###  Find Me

This service represents the *Find my iPhone* functionality of iCloud.

##### Attention

This service is very good protected by Apple. As you know from iCloud.com you have to retype your credentials to use *FindMe* when your session is older than a few minutes. That means, *FindMe* needs fresh cookies and therefore you have to retype your credentials. It is also so, that theoretically *FindMe* needs an initialization and handles the requests a little bit complicated. Therefore I implemented a solution that does everything automatically, you just have to give your credentials to the method and than everything works automatically. If the request is the first one in your session, my method will initialize everything and so on. Of course, this takes more time. After this initialization the method shall work faster.

#### Get

```javascript
const devices = await myCloud.FindMe.get("my.account@mail.com", "totally-save-password");
```

You do not have to give your credentials again, these arguments are optional. Normally they will be used from the session instantly. (Your session remembers your password if you do not delete it).

**Demo:** `demo/findme/findMe.js`

Please also remember that the fist requests maybe does not return a position for the devices (Same thing when using *Friends*) because the position is still in progress. Sometimes you have to wait a few seconds.

That means in detail, that `get()` performs a new general initialization whose logic I want to prevent from you when using the API and, if needed, a new *login* when it is performed the first time. After that, the data will be requested normally. If your current instance always initialized `FindMe` in this way, the *re-login* will perfom only at the first time. After that your data is tried to get directly when using `get()`. But sometimes (after using it a few minutes) the cookies are too old and the data can not be requested. In this case an error occurs and you should set `initialized` property of your instance's `FindMe` object to `false`:
```javascript
// 'get()' occured an error that the cookies are non-existing or too old
myCloud.FindMe.initialized = false;


// A new call 'get()' will re-initialize everything
const devices = await myCloud.FindMe.get("my.account@mail.com", "totally-save-password");
```

Sadly there are still problems with the API. Sometimes the cookies of the session are invalid in general and `get()` still does not not work.

In this case you have to reset your whole session :(

#### Play Sound

To play sound on a device, use the `playSound()` method.

```javascript
// By giving a device's object
await myCloud.FindMe.playSound(myDevice);

// By giving just a device's ID
await myCloud.FindMe.playSound("XXX");
```

To get a device's object, just call `FindMe.get()`. This lists all devices and their related ID.

**Demo:** `demo/findme/playSound.js`

### Reminders

This service represents the *Reminders* app of iCloud.
Pleaae note that it's also not completed yet!

As I already said, I implemented Apples internal API's here and changed the object structure just when it was useful or to simplify the data. But the way what data is in which context given, is not my idea but Apples's.
In this case the collections and the *open* tasks are represented by one single enpoint. I restructured the result a little bit but all in all, it is one method. The *completed* tasks are represented by an own endpoint that doesn't returns collections. And that is the way it works. To split *collections* and *open* tasks into two methods would just slow down performance because of the fact that you would need to call two requests that get exactly the same data. Of course, that would be the more sinful way because of the fact that the enpoint that for *completed* doesn't returns *collections*. But I can't do any thing.

#### Get Open Tasks and Collections

As I already explained, these methods return **collections** and within them, the tasks they are containing.


```javascript
const tasks = await myCloud.Reminders.getOpenTasks();
```

**Demo:** `demo/reminders/getOpenTasks.js`

#### Get Completed Tasks

To get a list with all completed tasks

```javascript
myCloud.Reminders.getCompletedTasks(function(err, tasks) {
  // If an error occurs
  if (err) return console.error(err);
  // All completed tasks (Not sorted by collections!)
  console.log(tasks);
});
```

**Demo:** `demo/reminders/getCompletedTasks.js`

#### Delete Task

```javascript
// 'myTaskIDontLike' is just a task object we want to delete

const delChangeset = await myCloud.Reminders.deleteTask(myTaskIDontLike);
```

**Demo:** `demo/reminders/deleteTask.js`

#### Change Task

```javascript
// 'myTask' is just a task object we want to change

myTask.title = "This is the new title :)"; // Don't use special characters like 'ä', 'ö', etc.
const changeset = await myCloud.Reminders.changeTask(myTask);
```

**Demo:** `demo/reminders/changeTask.js`

#### Create Task

```javascript
const createChangeset = await myCloud.Reminders.createTask({
  title: "I have to do this!",
  pGuid: "tasks", // The 'guid' of a collection
  priority: 1, // 1 is "High", 5 is "Medium" & 9 is "Low",
  description: "This describes by task perfectly!"
});
```

**Demo:** `demo/reminders/createTask.js`

##### Properties

Because the sepeific properties to describe a task and its alarms, is part of Apple's internal API, I do not offer a documentation about this properties and their values because they can change every time.

To get an idea about the specific properties, try out some tasks and have a look at their objects literal using `getOpenTasks()` or `getCompletedTasks()`.
The API's are transmitted directly without changes except datetime data. I try to parse it all into **Date** objects, so you don't have to care about the internal way of transmitting datetimes.

#### Complete Task

To complete a task, just do the following:
(Please note that something like a *uncomplete* action is currently not implemented and therefore only possible manually. It's still in progress)

```javascript
// 'myTaskICompleted' is the task you want to define as 'completed'

const chageset = await myCloud.Reminders.completeTask(myTaskICompleted);
```

**Demo:** `demo/reminders/completeTask.js`

#### Create Collection

```javascript
const createChangeset = await myCloud.Reminders.createCollection({
  title: "My new collection",
  symbolicColor: "green" // Default 'auto'
});
```

**Demo:** `demo/reminders/createCollection.js`

A created **collection** gets a specific `guid` from Apple it will be identified with.

As you may know from `Calendar`, you were allowed to use hex color codes as *#fa7b3d* when using a color for a *collection*. Sadly, `Reminders` API does not allow this kind of setting colors. We are only allowed to use specific color codes as `green`, `blue`, `red`, `orange`, `purple`, `yellow` or `brown`

#### Change Collection

```javascript
// 'myCollection' is just a collection we want to change
myCollection.symbolicColor = "green"; // Sets the symbolic color of the collection to 'green'
const changeset = await myCloud.Reminders.changeCollection(myCollection);
```

**Demo:** `demo/reminders/changeCollection.js`

#### Delete Collection

```javascript
// 'myCollectionIDontLike' is just a collection object we want to delete

const delChangeset = await myCloud.Reminders.deleteCollection(myCollectionIDontLike);
```

**Demo:** `demo/reminders/deleteCollection.js`

### Mail

Please make sure that you have Mail activated for iCloud.

Please keep in mind that the Mail service of iCloud and all related endpoints need some special cookies that are given when the first request for any of Mail's services is did. After that your session has the required cookies and the API's can be used. All of my Mail API's are designed in way that they repeat itself automatically if the cookies are needed and save them. Of course a `sessionUpdate` fires which makes it easy to save the session. Therefore you have to do nothing. I just say this because you shouldn't wonder if the first Mail API action takes longer than expected because your client has to do at least two requests instead of one.

#### Get Folders

Mailing systems in general work with folders that sort your mails. Such as `Sent`, `Inbox`, `Deleted`, `VIP` and your own folders.

```javascript
const folders = await myCloud.Mail.getFolders();
```

**Demo:** `demo/mail/getFolders.js`

Just try it out and have a look at the structure :)

#### List Messages

```javascript
// 'myFolder' is just a folder object we got from 'getFolders()'
// The 2nd and 3rd argument describe that we list the next 50 mails beginning at index 1 (first/newest mail)
// The sort order is descending / newest mails first
const messagesData = await myCloud.Mail.listMessages(myFolder, 1, 50);
```

**Demo:** `demo/mail/listMessages.js`

The message objects you get here just contains meta data about the message and a preview in plain text.

#### Get Message's Detail

Maybe you already noticed that a message object from 'listMessages' doesn't contains the complete mail. That's because a message can be very large. To get the complete message content you have to request it separately:

```javascript
// 'myMail' is just a message object we got from 'listMessages()'
const messageDetail = await myCloud.Mail.getMessage(myMail);
```

**Demo:** `demo/mail/getMessage.js`

#### Move Messages

Please notice that you can only move messages that are part the same folder to a common destination folder with one API call. Otherwise an error will occur. To move multiple messages that are part of *different* folders to a common destination, you need multiple API calls.

```javascript
// Items of the array are the messages you want to move (message objects)
// Has to be an array if you have more than one messages you want to move. If it's only one message, it's message object can be used as argument instead
const changeset = await myCloud.Mail.move([
  myMessage1, // The two messages have to be in the same folder!
  myMessage2 // Otherwise an error will occur
], destinationFolder); // 2nd argument is the destination folder (folder object)
```

**Demo:** `demo/mail/moveMessages.js`

#### Delete Message

```javascript
// Items of the array are the messages you want to move (message objects)
// Has to be an array if you have more than one messages you want to move. If it's only one message, it's message object can be used as argument instead
const delChangeset = await myCloud.Mail.delete([
  myMessage1,
  myMessage2
]);
```

**Demo:** `demo/mail/deleteMessages.js`

Please keep in mind that a message you delete will normally just be moved to *TRASH* folder. Just if you delete a message within the *TRASH* folder, the message will be deleted completely.

#### Flag

Flagging is like *marking/selecting* your message. There are two existing **flags** iCloud Mail accepts.

1. `unread` Mostly known as the blue point on the left side of your mail
2. `flagged` A mostly orange flag or point on your message

##### Add Flag

```javascript
// 1st argument is the message (myMessages is just an array containing message objects literal)
// 2nd argument is the flag you want to add. Possible values are 'flagged' and 'unread'. Default is 'flagged'.
const flagChangeset = await myCloud.Mail.flag([
  myMessages[0],
  myMessages[1]
], "flagged");
```

**Demo:** `demo/mail/flagMessages.js`

##### Remove Flag

```javascript
// 1st argument is the message (myMessages is just an array containing message objects literal)
// 2nd argument is the flag you want to remove. Possible values are 'flagged' and 'unread'. Default is 'flagged'.
const unflagChangeset = await myCloud.Mail.unflag([
  myMessages[0],
  myMessages[1]
], "unread");
```

Please keep in mind that `unread` means really unread. That means to flag your message as **read** you have to **unflag** the `unread` flag.

**Demo:** `demo/mail/unflagMessages.js`


#### Send Mail

To send a mail, you should remember that if you do not use a `from` property, this method will try to get your iClouds mail address using a second API. If you didn't performed a `__preference()` method before (which will mostly be the case), the `send()` method will do this to get your iCloud's mail address. Of course only if you did not give it as property (`from`). And of course, such a second API call in background will take more time.

```javascript
const sentment = await myCloud.Mail.send({
  //from: "Your Name<your.address@icloud.com>", If not given, your address will be found automatically
  to: "conr.maur@googlemail.com", // Required
  subject: "Your API",
  body: "<strong>Hey Maurice,</strong><br><br>I totally love your <i>API</i>. Of course it's not perfect but <strong>I love it</strong>", // HTML string
  attachments: [ // Optional
    // Your attachments
    // Not implemented yet
    // Coming soon
  ]
});
```

**Demo:** `demo/mail/sendMail.js`

#### Create Folder

```javascript
const createChangeset = await myCloud.Mail.createFolder({
  name: "My new Folder", // Default null
  parent: null // Can be a folder object or a guid string (Default null)
});
```

Sadly there exist a bug within the web application of iCloud. If you create a folder with this API, sometimes, the web app will need a lot of time to get the new folder. But if you delete or rename an existing folder, your new folder becomes visible. I don't know the reason but all in all, your folder exist in iCloud's database and a `getFolders()` call will return the new folder.

**Demo:** `demo/mail/createFolder.js`

#### Move Folder

Please keep in mind that you are not allowed to move one of iCloud's default folders such as "Inbox", "Drafts", "Archive", "Deleted Messages" or "Junk".
You are only allowed to move your own folders with the `role` `FOLDER`;-)

```javascript
// 'myFolder' is just a folder object
// 'myTargetFolder' is also just a folder object
const moveChangeset = await myCloud.Mail.moveFolder(myFolder, myTargetFolder);
```

**Demo:** `demo/mail/moveFolder.js`

If you want to move a sub folder from its parent folder to "global" level without a parent, set the 2nd argument (*targetFolder*) to. This will remove the `parent` property and your folder is global.

#### Rename Folder

Please keep in mind that you are not allowed to rename one of iCloud's default folders such as "Inbox", "Drafts", "Archive", "Deleted Messages" or "Junk".
You are only allowed to rename your own folders with the `role` `FOLDER`;-)

```javascript
// 'myFolder' is just a folder object
const renameChangeset = await myCloud.Mail.renameFolder(myFolder, "New Name");
```

**Demo:** `demo/mail/renameFolder.js`

Sadly there exist a bug within the web application of iCloud. If you rename a folder with this API, sometimes, the web app will need a lot of time to update the folder. But if you delete or rename an existing folder in the web app, your folder's name becomes visible. I don't know the reason but all in all, your folder exist in iCloud's database and a `getFolders()` will return the correct name.

#### Delete Folder

```javascript
// 'myFolder' is just a folder object
const delChangeset = await myCloud.Mail.deleteFolder(myFolder);
```

**Demo:** `demo/mail/deleteFolder.js`

Sadly there exist a bug within the web application of iCloud. If you delete a folder with this API, sometimes, the web app will need a lot of time to get the updated folder list. But if you delete or rename an existing folder in the web app, your deleted folder would stop being visible. I don't know the reason but all in all, your folder exist in iCloud's database and a `getFolders()` will return the correct folder list.


### Notes

#### Attention

The database of your notes can be very large. And therefore the internal API of Apple uses `records`. A normal iCloud client requests for a *zone* (There is only one zone called *Notes*) and gets just a few notes. Now, if the user scrolls down, more records will be requested. On the one hand, this API is very smart but on the other hand, it's very slow. Therefore I implemented the method  `getAll()` which really gets **all** your notes but also takes a lot of time and requests if you have a lot of notes.
That are the bad news.
But the good news are, that a `progress` event fires and returns the current loaded `records`. A `record` can be a `Note` or a `Folder`. The only **problem** is that you may have a Note *record* but the associated *Folder* is not loaded yet. Only if `getAll()` really finishes, you can be completely sure that the folder a Note is associated with, is described in a `record` you also got.

This is not perfect, I know. But that is the way how Apple's API works and I can not change this generally.
I just can recommend to use the method `getFolder()` because if you got a *Note* `record` but not the `record` of the related *Folder*, you may have a problem. This offers you the possibility to get the folder's data **before** the folder is returned a record.

If the `getAll()` method is finished totally, the result is sorted by folders.

#### Get Notes

```javascript
// Get all notes
myCloud.Notes.getAll().then(function(result) {
  console.log(result);
});

// Please keep in mind that records coming from "progress" event are not simplified by the API and you have to use them as they are

// There come your records from 'getAll()'
// You may use them before 'getAll()' is finished
myCloud.on("progress", function(event) {
  // Relate to the 'getAll()' method
  if (event.parentAction === "getAll") {
    // The 'zone' object is not important. Important are the 'records' within it
    // These records are new and may contain Notes or Folders
    // What they are actually containing is described in their object structure
    console.log(event.zone.records);
    // Here you can have a look at every record's 'parent' property and when the parent folder isn't loaded as record, you can load it manually with 'getFolders()' because it accepts also 'recordName' as arguments
  }
});
```

**Demo getting all:** `demo/notes/getAll.js`

**Demo getting all with progress:** `demo/notes/getAllProgress.js`

#### Get Folders

Get folder objects directly. This is important because a `getAll()` call can take a lot of time.

```javascript
// 'myFolder1' & 'myFolder2' can be folder objects but also a plain 'recordName' as string (Useful if you know a folder's 'recordName' from a 'Note' record but not it's whole object because it is a record you actually don't have)
myCloud.Notes.getFolders([ // Can also be a single folder object or a single 'recordName' string if it's only one
  myFolder1,
  myFolder2
], function(err, folders) {
  // If an error occurs
  if (err) return console.error(err);
  // Array with your folder's data
  console.log(folders);
});
```

**Demo:** `demo/notes/getFolders.js`

#### Get Notes

Because a `getAll()` call can take a lot of time and the note you want may comes very late, you can load a note directly if you already know the whole *Note* object or just it's *record name*.

```javascript
// 'myNote1' & 'myNote2' can be note objects but also a plain 'recordName' as string
myCloud.Notes.getNotes([ // Can also be a single note object or a single 'recordName' string if it's only one
  myNote1, // Note object or just a record name
  myNote2 // Note object or just a record name
], function(err, notes) {
  // If an error occurs
  if (err) return console.error(err);
  // Array with your note's data
  console.log(notes);
});

// This will return all requested notes directly
```

**Demo:** `demo/notes/getNotes.js`

## Push Services

To use push services to recognize when something changes, you need to register a service for being notified by Apple's push service.

You just have to follow these instructions:

### Initialization

Because a push notification is more less an infinity loop of requests, the programmatically logic behind listening for push services keeps your script running.

Because this is may not your intention, the logic behind push services will not be initialized automatically when initializing your instance. You have to do it manually:

Sometimes, your token is expired. In this case, the method `initPush()` will automatically request a new one. But of course, this takes a little bit more time.

```javascript
// This initializes your instance to listen for push notifications in general
myCloud.initPush();

// Your script will keep running until you do not shut it down manually
```

### Push Event

Getting push notifications:

```javascript
myCloud.on("push", function(notification) {
  console.log("New push notification!");
  console.log(notification);
});
```

Please note, that you can omly get `push` events for registered services.


## Events

There are a few events you can listen to. For example the `progress` event that fires every time, an action is divided into some sub actions that need time. For example the *login* process fires **three** `progress` events.

If you `getEvents()` from *Calendar*, the count of fired *progress* events is related to the total amount of events that have to be requested for detailed information about them.

As I already explained, the *FindMe* service often requires a new login. The `get` method of *FindMe* does this automatically. And in this case a new `login()` will be executed which means that there will also three `progress` events fired.

### Progress Event

```javascript
myCloud.on("progress", function(event) {
  console.log(event);
});
```

#### Result

```javascript
{
  parentAction: "yourMethod", // The method name of the method the action is related to
  action: "what-currently-happens", // A special keyword that describes the current action
  progress: 0.5 // Number between 0 and 1
  /*

    Some specific properties of the current action

  */
}
```

### Ready Event

This event is used when you call the `iCloud` instance with a session and your credentials. *(Recommended way of initialization)*. Then, the `ready` fires when your session is valid or (if not) the automatic login process will be finished. It is really useful if you want to write less code and a clean way initialization including all kinds of error handling such as invalid credentials, invalid sessions or expired cookies.

```javascript
myCloud.on("ready", function() {
  // Your iCloud instance is ready to use!
});
```

Please note that the time your instance needs to be `ready` is related to the fact wether you already have a valid working session or your session has to be re-initialized completely (because cookies are expired or something else is broken). In such a case a complete new `login()` process will be executed which takes time.

### Session Update Event

This event fires every time when the current session updates. For example, if new cookies are request (e.g. when using *FindMe*). It fires also after a normal login. You should use it to save your session at this point.

```javascript
myCloud.on("sessionUpdate", function() {
  // Session changed
});
```

### Error Event

**Please note**, the `err` event is *not* used to determine wether a method does not work. In such a case, you get an error thrown normally by a rejected promise or, if you are using the callback function, as **1st argument**. The `err` event is fired every time an error occurs but the method is not failed instantly. E.g. If you do not have a session, your cookies are too old or a broken one, an `err` event fires that determines that your instance was not abled to use your current session. But of course, the instance will login your account a second time and is trying to create a new session. Or, if you log in but a two-factor-authentication is required, an `err` event fires. In this case you should enter your *code* as explained in [Two Factor Authentication](#two--factor--authentication).

### Error Event

```javascript
myCloud.on("err", function(event) {
  console.error(event);
});
```

## Important

I do not support any malicious use or abuse of this project that harms third parties, steals data or violates personals rights. This project is made for personal use only with your personal account and not to make use of third parties private data such as tracking or manipulating accounts. You are not allowed to abuse functions or algorithms of this project for criminal activities.

## Improvements
Any questions or improvements? Open a new issue on GitHub or mail me at [conr.maur@googlemail.com](mailto:conr.maur@googlemail.com) :)

## Not finished
µ
Of course this module is not finished. Not all services are completed, there is always stuff to do. At the moment, it is still in progress and I'm working on it much as possible :)

## Thanks

Thanks for your Attention. It took a lot of time to implement this prject in the current state. Just to understand Apple's API's was really hard work. I lost more than 100 hours in this project. **Hope, you enjoy :)**
