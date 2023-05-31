import * as pulumi from "@pulumi/pulumi";
export interface S3WebsiteArgs {
    content: string;
    stackName: string;
    tags: {
        [key: string]: string;
    };
}
export declare class S3Website extends pulumi.ComponentResource {
    readonly websiteUrl: pulumi.Output<string>;
    constructor(name: string, args: S3WebsiteArgs, opts?: pulumi.ComponentResourceOptions);
}
