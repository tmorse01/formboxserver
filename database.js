const { MongoClient } = require("mongodb");

var testData = require("./sampledata/tmorsedata.json");
var arrayOfTestData = require("./sampledata/arrayoftestdata.json");

async function main() {
  const uri = "mongodb://localhost:27017";

  //create instance of mongo client
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // await listDatabases(client);
    // await createFormData(client, testData);
    // await createMultipleFormData(client, arrayOfTestData);
    // await findOneFormByUserName(client, "tmorse");
    await findResponseByFormName(client, "form1");
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function createFormData(client, newFormData) {
  const result = await client
    .db("formboxdata")
    .collection("formdata")
    .insertOne(newFormData);
  console.log(
    `New form data created with the following id: ${result.insertedId} `
  );
}

async function createMultipleFormData(client, newFormDataArray) {
  const result = await client
    .db("formboxdata")
    .collection("formdata")
    .insertMany(newFormDataArray);
  console.log(
    `${result.insertedCount} new form data created with the following id(s):`
  );
  console.log(result.insertedIds);
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log(`- ${db.name}`);
  });
}

async function findOneFormByUserName(client, username) {
  const result = await client
    .db("formboxdata")
    .collection("formdata")
    .findOne({ username: username });

  if (result) {
    console.log(`Found a form submitted by : ${username}`);
    console.log(result);
  } else {
    console.log(`No results`);
  }
}

async function findResponseByFormName(client, formName) {
  const cursor = await client
    .db("formboxdata")
    .collection("formdata")
    .find({ name: formName });

  const results = await cursor.toArray();
  if (results) {
    console.log(`Found results for form : ${formName}`);
    results.forEach((result, i) => {
      console.log("result", result);
      //   console.log(`result ${i}: ${result}`);
    });
    return results;
  } else {
    console.log(`No results`);
    return undefined;
  }
}
