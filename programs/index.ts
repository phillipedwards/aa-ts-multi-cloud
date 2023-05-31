import * as pulumi from "@pulumi/pulumi";
import { S3Website } from "./websites/s3Website";
import { GcpWebsite } from "./websites/gcpWebsite";

export = async () => {
    const config = new pulumi.Config();
    const cloud = config.require("cloud-provider");
    const content = config.require("content");

    const tags = {
        "stack": pulumi.getStack(),
        "project": pulumi.getProject(),
        "organization": pulumi.getOrganization()
    };

    let websiteUrl: pulumi.Output<string> = pulumi.output("");
    switch (cloud) {
        case "aws":
            const awsSite = new S3Website("s3website", {
                content: content,
                stackName: pulumi.getStack(),
                tags: tags
            });

            websiteUrl = awsSite.websiteUrl;
            break;

        case "gcp":
            const gcpSite = new GcpWebsite("gcpWebsite", {
                content: content,
                stackName: pulumi.getStack(),
                tags: tags
            });

            websiteUrl = gcpSite.websiteUrl;
            break;

        case "azure":
            throw new Error("Support for Azure coming soon!");

        default:
            throw new Error(`Unsupported cloud ${cloud} encountered. Use AWS, AZURE, or GCP`);
    }

    return {
        "siteUrl": websiteUrl
    }
};