import {
    LocalWorkspace,
    ConcurrentUpdateError,
    StackAlreadyExistsError,
    StackNotFoundError,
    Stack
} from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as express from "express";
import { createPulumiProgram } from "./pulumiProgram";

const projectName = "storage";
const projectDir = upath.joinSafe(__dirname, "..", "..", "programs");
const org = "phillipedwards";

// creates new sites
export const createHandler: express.RequestHandler = async (req, res) => {
    const stackName = req.body.id;
    const content = req.body.content as string;
    const cloudProvider = req.body.provider as string;

    try {

        const stack = await LocalWorkspace.createStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });

        await configValuesForProvider(stack, cloudProvider);
        await stack.setConfig("content", { value: content });
        await stack.setConfig("cloud-provider", { value: cloudProvider });

        // deploy the stack, tailing the logs to console
        const upRes = await stack.up({ onOutput: console.info });
        res.json({ id: stackName, url: upRes.outputs.siteUrl.value });
    } catch (e) {
        if (e instanceof StackAlreadyExistsError) {
            res.status(409).send(`stack "${stackName}" already exists`);
        } else {
            res.status(500).send(e);
        }
    }
};

// updates the content for an existing site
export const updateHandler: express.RequestHandler = async (req, res) => {
    const stackName = req.body.id;
    const content = req.body.content as string;
    const cloudProvider = req.body.provider as string;

    try {
        console.log(stackName);
        console.log(projectDir);
        const stack = await LocalWorkspace.selectStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });

        await configValuesForProvider(stack, cloudProvider);
        await stack.setConfig("content", { value: content });
        await stack.setConfig("cloud-provider", { value: cloudProvider });

        // deploy the stack, tailing the logs to console
        const upRes = await stack.up({ onOutput: console.info });
        res.json({ id: stackName, url: upRes.outputs.siteUrl.value });
    } catch (e) {
        if (e instanceof StackNotFoundError) {
            res.status(404).send(`stack "${stackName}" does not exist`);
        } else if (e instanceof ConcurrentUpdateError) {
            res.status(409).send(`stack "${stackName}" already has update in progress`)
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
        res.status(500).send(e);
    }
};

// gets info about a specific site
export const getHandler: express.RequestHandler = async (req, res) => {
    const stackName = req.params.id;
    try {
        // select the existing stack
        const stack = await LocalWorkspace.selectStack({
            stackName: `${org}/${stackName}`,
            workDir: projectDir,
        });
        const outs = await stack.outputs();
        res.json({ id: stackName, url: outs.websiteUrl.value });
    } catch (e) {
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
            stackName: `${org}/${stackName}`,
            workDir: projectDir
        });

        // deploy the stack, tailing the logs to console
        await stack.destroy({ onOutput: console.info });
        await stack.workspace.removeStack(`${org}/${stackName}`);
        res.status(200).end();
    } catch (e) {
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
    switch (provider) {
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