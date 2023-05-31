"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const automation_1 = require("@pulumi/pulumi/automation");
const upath = require("upath");
const projectName = "storage";
const projectDir = upath.joinSafe(__dirname, "..", "..", "programs");
const org = "phillipedwards";
// creates new sites
exports.createHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stackName = req.body.id;
    const content = req.body.content;
    const cloudProvider = req.body.provider;
    try {
        const stack = yield automation_1.LocalWorkspace.createStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });
        yield configValuesForProvider(stack, cloudProvider);
        yield stack.setConfig("content", { value: content });
        yield stack.setConfig("cloud-provider", { value: cloudProvider });
        // deploy the stack, tailing the logs to console
        const upRes = yield stack.up({ onOutput: console.info });
        res.json({ id: stackName, url: upRes.outputs.siteUrl.value });
    }
    catch (e) {
        if (e instanceof automation_1.StackAlreadyExistsError) {
            res.status(409).send(`stack "${stackName}" already exists`);
        }
        else {
            res.status(500).send(e);
        }
    }
});
// updates the content for an existing site
exports.updateHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stackName = req.body.id;
    const content = req.body.content;
    const cloudProvider = req.body.provider;
    try {
        console.log(stackName);
        console.log(projectDir);
        const stack = yield automation_1.LocalWorkspace.selectStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });
        yield configValuesForProvider(stack, cloudProvider);
        yield stack.setConfig("content", { value: content });
        yield stack.setConfig("cloud-provider", { value: cloudProvider });
        // deploy the stack, tailing the logs to console
        const upRes = yield stack.up({ onOutput: console.info });
        res.json({ id: stackName, url: upRes.outputs.siteUrl.value });
    }
    catch (e) {
        if (e instanceof automation_1.StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        }
        else if (e instanceof automation_1.ConcurrentUpdateError) {
            res.status(409).send(`stack "${stackName}" already has update in progress`);
        }
        else {
            res.status(500).send(e);
        }
    }
});
// lists all sites
exports.listHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // set up a workspace with only enough information for the list stack operations
        const ws = yield automation_1.LocalWorkspace.create({ projectSettings: { name: projectName, runtime: "nodejs" } });
        const stacks = yield ws.listStacks();
        res.json({ ids: stacks.map(s => s.name) });
    }
    catch (e) {
        res.status(500).send(e);
    }
});
// gets info about a specific site
exports.getHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stackName = req.params.id;
    try {
        // select the existing stack
        const stack = yield automation_1.LocalWorkspace.selectStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });
        const outs = yield stack.outputs();
        res.json({ id: stackName, url: outs.websiteUrl.value });
    }
    catch (e) {
        if (e instanceof automation_1.StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        }
        else {
            res.status(500).send(e);
        }
    }
});
// deletes a site
exports.deleteHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stackName = req.params.id;
    try {
        // select the existing stack
        const stack = yield automation_1.LocalWorkspace.selectStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir
        });
        // deploy the stack, tailing the logs to console
        yield stack.destroy({ onOutput: console.info });
        yield stack.workspace.removeStack(`${org}/${stackName}`);
        res.status(200).end();
    }
    catch (e) {
        if (e instanceof automation_1.StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        }
        else if (e instanceof automation_1.ConcurrentUpdateError) {
            res.status(409).send(`stack "${stackName}" already has update in progress`);
        }
        else {
            res.status(500).send(e);
        }
    }
});
const configValuesForProvider = (stack, provider) => __awaiter(void 0, void 0, void 0, function* () {
    switch (provider) {
        case "aws":
            yield stack.setConfig("aws:region", { value: "us-west-2" });
            break;
        case "gcp":
            yield stack.setConfig("gcp:project", { value: "pulumi-ce-team" });
            break;
        default:
            throw new Error(`unsupported cloud ${provider}`);
    }
});
//# sourceMappingURL=handlers.js.map