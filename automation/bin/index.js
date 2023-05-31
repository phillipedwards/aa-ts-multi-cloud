"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const handlers_1 = require("./handlers");
const app = express();
app.use(express.json());
// setup our RESTful routes for our Site resource
app.post("/sites", handlers_1.createHandler);
app.get("/sites", handlers_1.listHandler);
app.get("/sites/:id", handlers_1.getHandler);
app.put("/sites/:id", handlers_1.updateHandler);
app.delete("/sites/:id", handlers_1.deleteHandler);
// start our http server
app.listen(8080, () => console.info("server running on port localhost:8080"));
//# sourceMappingURL=index.js.map