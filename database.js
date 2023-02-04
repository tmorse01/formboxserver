const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

var testData = require("./sampledata/tmorsedata.json");
var arrayOfTestData = require("./sampledata/arrayoftestdata.json");

var _dbClient;

function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: "1800s" });
}

module.exports = {
  getClient: async function () {
    // console.log("getClient: ", _dbClient);
    if (_dbClient) {
      return _dbClient;
    } else {
      return await this.connectToServer();
    }
  },
  connectToServer: function () {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    client.connect();
    _dbClient = client;
    console.log("connected to SERVER test");
    return client;
    // return MongoClient.connect(uri, async function (err, client) {
    //   //create instance of mongo client
    //   _dbClient = client;
    //   return client;
    //   console.log("connected to mongodb client: ", _dbClient);
    //   // if (callback) return callback(err);
    // });
  },
  login: async function (loginInfo) {
    console.log("login: ", loginInfo);
    const client = await this.getClient();
    const result = await client
      .db("formboxdata")
      .collection("users")
      .findOne({ username: loginInfo.username });
    const encryptedUserPassword = result.password;
    // Comparing the user input password to one associted with user in the db
    const isMatch = await bcrypt.compare(
      loginInfo.password,
      encryptedUserPassword
    );
    if (isMatch) {
      return generateAccessToken({ username: loginInfo.username });
    } else {
      return undefined;
    }
  },
  signup: async function (loginInfo) {
    console.log("signup: ", loginInfo);
    const client = await this.getClient();
    const password = loginInfo.password;
    bcrypt.genSalt(10, function (err, Salt) {
      // The bcrypt is used for encrypting password.
      bcrypt.hash(password, Salt, async function (err, hash) {
        if (err) {
          return console.log("Cannot encrypt");
        }
        const result = await client
          .db("formboxdata")
          .collection("users")
          .insertOne({
            username: loginInfo.username,
            password: hash,
          });
        // handle error path return something here

        console.log(
          `User sign up: ${loginInfo.username} ${result.insertedId} `
        );
      });
    });
  },
  createFormData: async function (newFormData) {
    console.log("createFormData: ", newFormData);
    const client = await this.getClient();
    const result = await client
      .db("formboxdata")
      .collection("formdata")
      .insertOne(newFormData);
    console.log(
      `New form data created with the following id: ${result.insertedId} `
    );
  },
  createMultipleFormData: async function (newFormDataArray) {
    const client = await this.getClient();
    const result = await client
      .db("formboxdata")
      .collection("formdata")
      .insertMany(newFormDataArray);
    console.log(
      `${result.insertedCount} new form data created with the following id(s):`
    );
    console.log(result.insertedIds);
  },
  saveForm: async function (formObject) {
    const client = await this.getClient();
    const formName = formObject.formName;

    try {
      // upsert
      const result = await client
        .db("formboxdata")
        .collection("forms")
        .update({ formName }, { $set: formObject }, { upsert: true });
      console.log(
        `Form form data saved with the following id: ${result.insertedId} `
      );
      return true;
    } catch (e) {
      console.error("Error saving form :", e);
      return false;
    }
  },
  getForms: async function (username) {
    const client = await this.getClient();
    const results = await client
      .db("formboxdata")
      .collection("forms")
      .find({ username })
      .toArray();
    return results;
  },
  getForm: async function (form) {
    const client = await this.getClient();
    const results = await client
      .db("formboxdata")
      .collection("forms")
      .findOne({ formName: form });
    return results;
  },
  getFormData: async function (formName) {
    // console.log("call to getFormData", formName);
    const client = await this.getClient();
    const results = await client
      .db("formboxdata")
      .collection("formdata")
      .find({ formName: formName })
      .toArray();
    return results;
  },

  // async function listDatabases(client) {
  //   const databasesList = await client.db().admin().listDatabases();
  //   console.log("Databases:");
  //   databasesList.databases.forEach((db) => {
  //     console.log(`- ${db.name}`);
  //   });
  // }

  // async function findOneFormByUserName(client, username) {
  //   const result = await client
  //     .db("formboxdata")
  //     .collection("formdata")
  //     .findOne({ username: username });

  //   if (result) {
  //     console.log(`Found a form submitted by : ${username}`);
  //     console.log(result);
  //   } else {
  //     console.log(`No results`);
  //   }
  // }

  // async function findResponseByFormName(client, formName) {
  //   const cursor = await client
  //     .db("formboxdata")
  //     .collection("formdata")
  //     .find({ name: formName });

  //   const results = await cursor.toArray();
  //   if (results) {
  //     console.log(`Found results for form : ${formName}`);
  //     results.forEach((result, i) => {
  //       console.log("result", result);
  //       //   console.log(`result ${i}: ${result}`);
  //     });
  //     return results;
  //   } else {
  //     console.log(`No results`);
  //     return undefined;
  //   }
  // }
};
