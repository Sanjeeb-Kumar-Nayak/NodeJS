const express = require("express");
const dbConnect = require("../mongodb/database");
const cors = require("cors");
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", async (req, resp) => {
  let data = await dbConnect();
  data = await data.find().toArray();
  let response = { status: 1, message: "Success", data: data };
  resp.send(response);
});

app.post("/", async (req, resp) => {
  let data = await dbConnect();
  let result = await data.insert(req.body);
  resp.send(result);
});

app.put("/:Model", async (req, resp) => {
  let data = await dbConnect();
  let result = await data.updateOne(
    // {Model:"V20"},
    { Model: req.params.Model },
    // {Model:req.body.Model},
    { $set: req.body }
  );
  resp.send(result);
});

app.delete("/", async (req, resp) => {
  let data = await dbConnect();
  let result = await data.deleteOne({ Model: "V95" });
  resp.send(result);
});

app.post("/user/login", async (req, resp) => {
  let data = await dbConnect();
  data = await data.find().toArray();
  let response = { status: 1, message: "Success", data: data };
  resp.send(response);
});

app.listen(5600);
