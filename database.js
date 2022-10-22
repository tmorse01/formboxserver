const { MongoClient } = require("mongodb");

var testData = require("./sampledata/tmorsedata.json");
var arrayOfTestData = require("./sampledata/arrayoftestdata.json");

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
    const result = await client
      .db("formboxdata")
      .collection("forms")
      .insertOne(formObject);
    console.log(
      `New form data created with the following id: ${result.insertedId} `
    );
  },
  getForms: async function () {
    console.log("call to getForms");
    const client = await this.getClient();
    const results = await client
      .db("formboxdata")
      .collection("forms")
      .find()
      .toArray();
    return results;
  },
  getFormData: async function (documentName) {
    console.log("call to getFormData", documentName);
    const client = await this.getClient();
    const results = await client
      .db("formboxdata")
      .collection("formdata")
      .find({ documentName: documentName })
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
