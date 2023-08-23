import {
    LocalWorkspace,
    ConcurrentUpdateError,
    StackAlreadyExistsError,
    StackNotFoundError,
    Stack
} from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as express from "express";

const projectName = "multi-cloud";
const projectDir = upath.joinSafe(__dirname, "..", "..", "programs");

// creates new sites
export const createHandler: express.RequestHandler = async (req, res) => {
    const {
        id,
        content,
        provider,
        cidr,
        deployK8s,
        desiredCapacity
    } = req.body;

    console.log(req.body);
    try {

        const stack = await LocalWorkspace.createStack({
            stackName: id,
            workDir: projectDir,
        });

        await configValuesForProvider(stack, provider);
        await stack.setConfig("content", { value: content });
        await stack.setConfig("cloud-provider", { value: provider });
        await stack.setConfig("cidr-block", { value: cidr });
        await stack.setConfig("deploy-k8s", { value: deployK8s === undefined ? false : deployK8s });
        await stack.setConfig("desired-capacity", { value: desiredCapacity == undefined ? 3 : desiredCapacity });

        // deploy the stack, tailing the logs to console
        const upRes = await stack.up({ onOutput: console.info });
        res.json({
            id: id,
            vpcId: upRes.outputs.vpcId?.value,
            serviceEndpoint: upRes.outputs.serviceEndpoint?.value,
            url: upRes.outputs.webSiteUrl?.value,
            serviceIp: upRes.outputs.serviceIp?.value
        });

    } catch (e) {
        console.log(e);
        if (e instanceof StackAlreadyExistsError) {
            res.status(409).send(`stack "${id}" already exists`);
        } else {
            res.status(500).send(e);
        }
    }
};

// updates the content for an existing site
export const updateHandler: express.RequestHandler = async (req, res) => {
    const {
        id,
        content,
        provider,
        cidr,
        deployK8s,
        desiredCapacity
    } = req.body;

    try {
        const stack = await LocalWorkspace.selectStack({
            stackName: id,
            workDir: projectDir,
        });

        await configValuesForProvider(stack, provider);
        await stack.setConfig("content", { value: content });
        await stack.setConfig("cloud-provider", { value: provider.trim() });
        await stack.setConfig("cidr-block", { value: cidr });
        await stack.setConfig("deploy-k8s", { value: deployK8s === undefined ? false : deployK8s });
        await stack.setConfig("desired-capacity", { value: desiredCapacity == undefined ? 3 : desiredCapacity });

        // deploy the stack, tailing the logs to console
        const upRes = await stack.up({ onOutput: console.info });
        res.json({
            id: id,
            vpcId: upRes.outputs.vpcId?.value,
            serviceEndpoint: upRes.outputs.serviceEndpoint?.value,
            url: upRes.outputs.webSiteUrl?.value,
            serviceIp: upRes.outputs.serviceIp?.value
        });
    } catch (e) {
        console.log(e);
        if (e instanceof StackNotFoundError) {
            res.status(404).send(`stack "${id}" does not exist`);
        } else if (e instanceof ConcurrentUpdateError) {
            res.status(409).send(`stack "${id}" already has update in progress`)
        } else {
            res.status(500).send(e);
        }
    }
};

// lists all sites
export const listHandler: express.RequestHandler = async (req, res) => {
    try {
        // set up a workspace with only enough information for the list stack operations
        const ws = await LocalWorkspace.create({ projectSettings: { name: projectName, runtime: "nodejs" } });
        const stacks = await ws.listStacks();
        res.json({ ids: stacks.map(s => s.name) });
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
};

// gets info about a specific site
export const getHandler: express.RequestHandler = async (req, res) => {
    const stackName = req.params.id;
    try {
        // select the existing stack
        const stack = await LocalWorkspace.selectStack({
            stackName: stackName,
            workDir: projectDir,
        });
        const outs = await stack.outputs();
        res.json({
            id: stackName,
            vpcId: outs.vpcId?.value,
            serviceEndpoint: outs.serviceEndpoint?.value,
            url: outs.webSiteUrl?.value,
            serviceIp: outs.serviceIp?.value
        });
    } catch (e) {
        console.log(e);
        if (e instanceof StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        } else {
            res.status(500).send(e);
        }
    }
};

// deletes a site
export const deleteHandler: express.RequestHandler = async (req, res) => {
    const stackName = req.params.id;
    try {
        // select the existing stack
        const stack = await LocalWorkspace.selectStack({
            stackName: stackName,
            workDir: projectDir
        });

        // deploy the stack, tailing the logs to console
        await stack.destroy({ onOutput: console.info });
        await stack.workspace.removeStack(stackName);
        res.status(200).end();
    } catch (e) {
        console.log(e);
        if (e instanceof StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        } else if (e instanceof ConcurrentUpdateError) {
            res.status(409).send(`stack "${stackName}" already has update in progress`)
        } else {
            res.status(500).send(e);
        }
    }
};

const configValuesForProvider = async (stack: Stack, provider: string) => {
    switch (provider.trim()) {
        case "aws":
            await stack.setConfig("aws:region", { value: "us-west-2" });
            break;

        case "gcp":
            await stack.setConfig("gcp:project", { value: "pulumi-ce-team" });
            break;

        default:
            throw new Error(`unsupported cloud ${provider}`);
    }
}