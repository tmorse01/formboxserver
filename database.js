const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const auth = require("./auth.js");

var _dbClient;

module.exports = {
  getClient: async function () {
    // console.log("getClient: ", _dbClient);
    if (_dbClient) {
      return _dbClient;
    } else {
      return await this.connectToServer();
    }
  },
  connectToServer: async function () {
    // console.log(
    //   "connectToServer mongo db connection",
    //   process.env.MONGO_DB_CONNECTION
    // );
    const uri = process.env.MONGO_DB_CONNECTION;
    const client = new MongoClient(uri);
    // console.log("connected to SERVER test", client);

    try {
      await client.connect();
      _dbClient = client;
      return client;
    } catch (e) {
      console.error("ERROR connecting to mongodb client: ", e);
    }
  },
  disconnectDb: async function () {
    try {
      if (_dbClient) {
        _dbClient.close();
        _dbClient = undefined;
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error("ERROR disconnecting mongodb client: ", e);
      return false;
    }
  },
  login: async function (loginInfo) {
    console.log("login: ", loginInfo);
    try {
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
        const accessToken = auth.generateAccessToken({
          username: loginInfo.username,
        });
        const refreshToken = auth.generateRefreshToken({
          username: loginInfo.username,
        });
        return { accessToken, refreshToken };
      } else {
        return undefined;
      }
    } catch (e) {
      console.error("ERROR with login: ", e);
    }
  },
  signup: async function (loginInfo) {
    // console.log("database sign up");
    try {
      const client = await this.getClient();
      const password = loginInfo.password;

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const result = await client
        .db("formboxdata")
        .collection("users")
        .insertOne({
          username: loginInfo.username,
          password: hash,
        });

      console.log(`User sign up: ${loginInfo.username} ${result.insertedId} `);
      return { ok: true, message: "User sign up successful." };
    } catch (e) {
      if (e.code === 11000) {
        throw new Error("Username already exists.");
      }
      throw e;
    }
  },
  createFormData: async function (newFormData) {
    console.log("createFormData: ", newFormData);
    const client = await this.getClient();
    const result = await client
      .db("formboxdata")
      .collection("formdata")
      .insertOne(newFormData);

    if (result.insertedId !== undefined) {
      console.log(
        `New form data created with the following id: ${result.insertedId} `
      );
      return true;
    } else {
      return false;
    }
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
        .updateOne({ formName }, { $set: formObject }, { upsert: true });
      console.log(`Form data saved name: ${formName} id: ${result.upsertedId}`);
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
    try {
      const client = await this.getClient();
      const results = await client
        .db("formboxdata")
        .collection("forms")
        .findOne({ formName: form });

      return results;
    } catch (e) {
      console.error("Error fetching form: ", form);
    }
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
