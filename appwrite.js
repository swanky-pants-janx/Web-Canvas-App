import { Client, Account, Databases, Permission, Role } from "https://cdn.jsdelivr.net/npm/appwrite@17/dist/esm/sdk.js";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6a03448100046eb339ac");

const account = new Account(client);
const databases = new Databases(client);

const DB_ID   = "webcanvas";
const COLL_ID = "projects";

client.ping().then(() => {
  console.log("Appwrite ping: OK");
}).catch((err) => {
  console.warn("Appwrite ping failed:", err);
});

export { client, account, databases, DB_ID, COLL_ID, Permission, Role };
