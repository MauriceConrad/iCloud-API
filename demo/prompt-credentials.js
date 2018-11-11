/*
  NOTE
  THis file is just a ready-to-use application that logs in to icloud and asks for the required credentials if needed
*/

const iCloud = require('../');

var prompt = require('prompt');

// Handles the requirement of two-factor-authentication
async function readyHandlerTwoFactor(myCloud) {

  if (myCloud.twoFactorAuthenticationIsRequired) {
    prompt.get(["Security Code"], function(err, input) {
      if (err) return console.error(err);
      const code = input["Security Code"];
      myCloud.securityCode = code;
    });
    return false;
  }
  else {
    console.log("You are logged in successfully!");

    return true;
  }

}

const sessionPath = "/tmp/icloud-session.json";

module.exports = function login() {
  return new Promise(function(resolve, reject) {
    prompt.start();

    var myCloud = new iCloud(sessionPath);
    myCloud.on("ready", async function() {
      // Returns
      const isAutheticated = await readyHandlerTwoFactor(myCloud);
      if (isAutheticated) {
        resolve(myCloud);
      }
    });
    myCloud.on("err", function(err) {
      if (err.errorCode == 6) {
        //console.error("Given session does not eixst or is expired. Try to use contained credentials from session to re-login...");
      }
      // Error code 7: Invalid credentials or borken account
      if (err.errorCode == 7) {
        console.error("The contained credentials are not correct or the given session does not exist/is broken.");
        // Try to get new credentials
        console.log("\nPlease log in with your credentials! (Username = Mail)");

        prompt.get({
            properties: {
              username: {
                pattern: /^.*$/,
                message: 'Mail',
                required: false
              },
              password: {
                required: false,
                hidden: true
              }
            }
          }, function(err, input) {
          if (err) return console.error(err);

          // This creates your iCloud instance
          var myCloud = new iCloud(sessionPath, input.username, input.password);

          myCloud.on("ready", async function() {

            const isAutheticated = await readyHandlerTwoFactor(myCloud);
            if (isAutheticated) {
              resolve(myCloud);
            }

          });

          myCloud.on("sessionUpdate", function() {
            myCloud.saveSession();
          });
        });
      }
    });


  });
}
