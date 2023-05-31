import * as pulumi from "@pulumi/pulumi";
import { S3Website } from "./websites/s3Website";
import { EksCluster } from "./clusters/eksCluster";
import { GcpWebsite } from "./websites/gcpWebsite";
import { GkeCluster } from "./clusters/gkeCluster";
import { Nginx } from "./kubernetes";

export = async () => {
    const config = new pulumi.Config();
    const cloud = config.require("cloud-provider");
    const content = config.require("content");
    const cidrBlock = config.get("cidr-block") || "10.100.0.0/16";

    const tags = {
        "stack": pulumi.getStack(),
        "project": pulumi.getProject(),
        "organization": pulumi.getOrganization()
    };

    let stackOutput: {
        webSiteUrl?: pulumi.Output<string>;
        kubeConfig?: pulumi.Output<string>;
        clusterEndpoint?: pulumi.Output<string>;
        serviceEndpoint?: pulumi.Output<string>
        vpcId?: pulumi.Output<string>;
    } = {};

    switch (cloud) {
        case "aws":
            const awsSite = new S3Website("s3website", {
                content: content,
                stackName: pulumi.getStack(),
                tags: tags
            });

            const eksCluster = new EksCluster("eksCluster", {
                vpcCidrBlock: cidrBlock,
            });

            stackOutput = {
                kubeConfig: eksCluster.kubeConfig,
                clusterEndpoint: eksCluster.endpoint,
                vpcId: eksCluster.vpcId,
                webSiteUrl: awsSite.websiteUrl,
            };
            break;

        case "gcp":
            const gcpConfig = new pulumi.Config("gcp");
            const project = gcpConfig.require("project");
            const region = gcpConfig.require("region");

            const gcpSite = new GcpWebsite("gcpWebsite", {
                content: content,
                stackName: pulumi.getStack(),
                tags: tags
            });

            const gkeCluster = new GkeCluster("gkeCluster", {
                cidrBlock: cidrBlock,
                gcpProject: project,
                gcpRegion: region,
                nodesPerZone: 1,
            });

            stackOutput = {
                kubeConfig: gkeCluster.kubeConfig,
                clusterEndpoint: gkeCluster.endpoint,
                vpcId: gkeCluster.vpcId,
                webSiteUrl: gcpSite.websiteUrl,
            };
            break;

        case "azure":
            throw new Error("Support for Azure coming soon!");

        default:
            throw new Error(`Unsupported cloud ${cloud} encountered. Use AWS or GCP`);
    }

    stackOutput.kubeConfig?.apply(s => console.log(s));

    // Using the kubeconfig from either EKS or GKE we will construct simple k8s nginx example
    const nginx = new Nginx("nginx", {
        kubeConfig: stackOutput.kubeConfig!
    });

    stackOutput.serviceEndpoint = nginx.endpoint;

    return stackOutput;
};