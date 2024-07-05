const fs = require("fs");
const express = require("express");
const axios = require("axios").default;
const { Cf } = require("./worker");

const workerFormStr = fs.readFileSync("./body.txt", "utf8");
const uuid = "d342d11e-d424-4583-b36e-524ab1f0afa4";

const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.send("hello world");
});

app.post("/createWorker", async (req, res) => {
  const { email, globalAPIKey, workerName, uuid, nodeName } = req.body;
  console.log(req.body);
  const cf = new Cf(email, globalAPIKey, workerName, uuid, nodeName);
  await cf.getAccount();
  await cf.getSubdomain();
  const { url, node } = await cf.createWorker();
  res.send({ url, node });
});

app.listen(process.env.PORT || 3000);
