"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pulumi = require("@pulumi/pulumi");
const aws_1 = require("@pulumi/aws");
class S3Website extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super("website:aws:s3Website", name, args, opts);
        const { content, stackName, tags } = args;
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
                        pulumi.interpolate `${siteBucket.arn}/*` // policy refers to bucket name explicitly
                    ]
                }]
        });
        this.websiteUrl = website.websiteEndpoint;
    }
}
exports.S3Website = S3Website;
//# sourceMappingURL=s3Website.js.map