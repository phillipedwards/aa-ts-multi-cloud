import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface GcpWebsiteArgs {
    content: string;
    stackName: string;
    tags: { [key: string]: string };
}

export class GcpWebsite extends pulumi.ComponentResource {
    public readonly websiteUrl: pulumi.Output<string>;

    constructor(name: string, args: GcpWebsiteArgs, opts?: pulumi.ComponentResourceOptions) {
        super("website:gcp:gcpWebsite", name, args, opts);

        // Create a storage bucket and configure it as a website.
        const bucket = new gcp.storage.Bucket("bucket", {
            location: "US",
            website: {
                mainPageSuffix: "index.html",
                notFoundPage: "index.html",
            },
        });

        new gcp.storage.BucketObject("index", {
            bucket: bucket.name,
            name: "index.html",
            content: args.content,
        })

        // Create an IAM binding to allow public read access to the bucket.
        const bucketIamBinding = new gcp.storage.BucketIAMBinding("bucket-iam-binding", {
            bucket: bucket.name,
            role: "roles/storage.objectViewer",
            members: ["allUsers"],
        });

        // Enable the storage bucket as a CDN.
        const backendBucket = new gcp.compute.BackendBucket("backend-bucket", {
            bucketName: bucket.name,
            enableCdn: true,
        });

        // Provision a global IP address for the CDN.
        const ip = new gcp.compute.GlobalAddress("ip", {});

        // Create a URLMap to route requests to the storage bucket.
        const urlMap = new gcp.compute.URLMap("url-map", { defaultService: backendBucket.selfLink });

        // Create an HTTP proxy to route requests to the URLMap.
        const httpProxy = new gcp.compute.TargetHttpProxy("http-proxy", { urlMap: urlMap.selfLink });

        // Create a GlobalForwardingRule rule to route requests to the HTTP proxy.
        new gcp.compute.GlobalForwardingRule("http-forwarding-rule", {
            ipAddress: ip.address,
            ipProtocol: "TCP",
            portRange: "80",
            target: httpProxy.selfLink,
        });

        this.websiteUrl = pulumi.interpolate`https://storage.googleapis.com/${bucket.name}/index.html`;
    }
}