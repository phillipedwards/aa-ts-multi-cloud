import * as pulumi from "@pulumi/pulumi";
import { s3 } from "@pulumi/aws";

export interface S3WebsiteArgs {
    content: string;
    stackName: string;
    tags: { [key: string]: string };
}

export class S3Website extends pulumi.ComponentResource {
    public readonly websiteUrl: pulumi.Output<string>;

    constructor(name: string, args: S3WebsiteArgs, opts?: pulumi.ComponentResourceOptions) {
        super("website:aws:s3Website", name, args, opts);

        opts = pulumi.mergeOptions(opts, { parent: this, deleteBeforeReplace: true });
        const { content, stackName, tags } = args;
        const siteBucket = new s3.BucketV2(`${stackName}-bucket`, {
            tags: tags
        }, opts);

        const bucketControls = new s3.BucketOwnershipControls(`${stackName}-controls`, {
            bucket: siteBucket.bucket,
            rule: {
                objectOwnership: "BucketOwnerPreferred",
            },
        }, opts);

        const bucketAccess = new s3.BucketPublicAccessBlock(`${stackName}-access`, {
            bucket: siteBucket.bucket,
            blockPublicAcls: false,
            blockPublicPolicy: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false
        }, opts);

        new s3.BucketAclV2(`${stackName}-acl`, {
            bucket: siteBucket.bucket,
            acl: "public-read"
        }, {
            ...opts,
            dependsOn: [bucketControls, bucketAccess]
        });

        const website = new s3.BucketWebsiteConfigurationV2(`${stackName}-website`, {
            bucket: siteBucket.bucket,
            indexDocument: {
                suffix: "index.html",
            },
            errorDocument: {
                key: "index.html",
            }
        }, opts);

        // write our index.html into the site bucket
        new s3.BucketObjectv2("index", {
            bucket: siteBucket.bucket,
            content: content,
            contentType: "text/html; charset=utf-8",
            key: "index.html"
        }, opts);

        const policy = pulumi.jsonStringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: "*",
                Action: [
                    "s3:GetObject"
                ],
                Resource: [
                    pulumi.interpolate`${siteBucket.arn}/*` // policy refers to bucket name explicitly
                ]
            }]
        });

        // Set the access policy for the bucket so all objects are readable
        new s3.BucketPolicy("bucketPolicy", {
            bucket: siteBucket.bucket, // refer to the bucket created earlier
            policy: policy // use output property `siteBucket.bucket`
        }, {
            ...opts,
            dependsOn: [bucketAccess, bucketControls]
        });

        this.websiteUrl = website.websiteEndpoint;
    }
}