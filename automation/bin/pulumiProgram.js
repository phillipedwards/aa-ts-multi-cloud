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
const pulumi = require("@pulumi/pulumi");
const aws_1 = require("@pulumi/aws");
exports.createPulumiProgram = (args) => () => __awaiter(void 0, void 0, void 0, function* () {
    const { stackName, tags, content } = args;
    // Create a bucket and expose a website index document
    const siteBucket = new aws_1.s3.BucketV2(`${stackName}-bucket`, {
        tags: tags
    });
    const bucketControls = new aws_1.s3.BucketOwnershipControls(`${stackName}-controls`, {
        bucket: siteBucket.bucket,
        rule: {
            objectOwnership: "BucketOwnerPreferred",
        },
    }, { deleteBeforeReplace: true });
    const bucketAccess = new aws_1.s3.BucketPublicAccessBlock(`${stackName}-access`, {
        bucket: siteBucket.bucket,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
    }, { deleteBeforeReplace: true });
    new aws_1.s3.BucketAclV2(`${stackName}-acl`, {
        bucket: siteBucket.bucket,
        acl: "public-read"
    }, {
        deleteBeforeReplace: true,
        dependsOn: [bucketControls, bucketAccess]
    });
    const website = new aws_1.s3.BucketWebsiteConfigurationV2(`${stackName}-website`, {
        bucket: siteBucket.bucket,
        indexDocument: {
            suffix: "index.html",
        },
        errorDocument: {
            key: "index.html",
        }
    }, { deleteBeforeReplace: true });
    // write our index.html into the site bucket
    new aws_1.s3.BucketObjectv2("index", {
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
                    pulumi.interpolate `${siteBucket.arn}/*` // policy refers to bucket name explicitly
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
    new aws_1.s3.BucketPolicy("bucketPolicy", {
        bucket: siteBucket.bucket,
        policy: policy // use output property `siteBucket.bucket`
    }, { dependsOn: [bucketAccess, bucketControls] });
    return {
        websiteUrl: website.websiteEndpoint,
    };
});
//# sourceMappingURL=pulumiProgram.js.map