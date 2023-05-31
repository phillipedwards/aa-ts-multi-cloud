import * as pulumi from "@pulumi/pulumi";
import { s3 } from "@pulumi/aws";
import { PolicyDocument } from "@pulumi/aws/iam";

// this function defines our pulumi S3 static website in terms of the content that the caller passes in.
// this allows us to dynamically deploy websites based on user defined values from the POST body.
export interface createProgramArgs {
    stackName: string;
    tags: { [key: string]: string; }
    content: string;
}

export const createPulumiProgram = (args: createProgramArgs) => async () => {
    const { stackName, tags, content } = args;
    // Create a bucket and expose a website index document
    const siteBucket = new s3.BucketV2(`${stackName}-bucket`, {
        tags: tags
    });

    const bucketControls = new s3.BucketOwnershipControls(`${stackName}-controls`, {
        bucket: siteBucket.bucket,
        rule: {
            objectOwnership: "BucketOwnerPreferred",
        },
    }, { deleteBeforeReplace: true });

    const bucketAccess = new s3.BucketPublicAccessBlock(`${stackName}-access`, {
        bucket: siteBucket.bucket,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
    }, { deleteBeforeReplace: true });

    new s3.BucketAclV2(`${stackName}-acl`, {
        bucket: siteBucket.bucket,
        acl: "public-read"
    }, {
        deleteBeforeReplace: true,
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
    }, { deleteBeforeReplace: true });

    // write our index.html into the site bucket
    new s3.BucketObjectv2("index", {
        bucket: siteBucket.bucket,
        content: content,
        contentType: "text/html; charset=utf-8",
        key: "index.html"
    }, { deleteBeforeReplace: true });

    const policy = pulumi.jsonStringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                //`${siteBucket.arn}/`,
                pulumi.interpolate`${siteBucket.arn}/*` // policy refers to bucket name explicitly
            ]
        }]
    });

    // Create an S3 Bucket Policy to allow public read of all objects in bucket
    // function publicReadPolicyForBucket(bucketName): PolicyDocument {
    //     return {
    //         Version: "2012-10-17",
    //         Statement: [{
    //             Effect: "Allow",
    //             Principal: "*",
    //             Action: [
    //                 "s3:GetObject"
    //             ],
    //             Resource: [
    //                 `arn:aws:s3:::${bucketName}/*` // policy refers to bucket name explicitly
    //             ]
    //         }]
    //     };
    // }

    // Set the access policy for the bucket so all objects are readable
    new s3.BucketPolicy("bucketPolicy", {
        bucket: siteBucket.bucket, // refer to the bucket created earlier
        policy: policy // use output property `siteBucket.bucket`
    }, { dependsOn: [bucketAccess, bucketControls] });

    return {
        websiteUrl: website.websiteEndpoint,
    };
};