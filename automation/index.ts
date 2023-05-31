import * as express from "express";
import {
    createHandler,
    listHandler,
    getHandler,
    updateHandler,
    deleteHandler
} from "./handlers";

const app = express();
app.use(express.json());

// setup our RESTful routes for our Site resource
app.post("/sites", createHandler);
app.get("/sites", listHandler);
app.get("/sites/:id", getHandler);
app.put("/sites/:id", updateHandler);
app.delete("/sites/:id", deleteHandler);

// start our http server
app.listen(8080, () => console.info("server running on port localhost:8080"));