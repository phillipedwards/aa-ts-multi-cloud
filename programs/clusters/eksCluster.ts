import * as pulumi from "@pulumi/pulumi";
import * as eks from "@pulumi/eks";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface EksClusterArgs {
    vpcCidrBlock: string;
}

export class EksCluster extends pulumi.ComponentResource {

    public readonly kubeConfig: pulumi.Output<string>;
    public readonly endpoint: pulumi.Output<string>;
    public readonly vpcId: pulumi.Output<string>;

    constructor(name: string, args: EksClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("cluster:aws:eksCluster", name, args, opts);

        opts = pulumi.mergeOptions(opts, { parent: this });
        const vpc = new awsx.ec2.Vpc(`${name}-vpc`, {
            enableDnsHostnames: true,
            enableDnsSupport: true,
            cidrBlock: args.vpcCidrBlock
        }, opts);

        const cluster = new eks.Cluster(`${name}-cluster`, {
            vpcId: vpc.vpcId,
            // Public subnets will be used for load balancers
            publicSubnetIds: vpc.publicSubnetIds,
            // Private subnets will be used for cluster nodes
            privateSubnetIds: vpc.privateSubnetIds,
            // Change configuration values to change any of the following settings
            instanceType: "t3.medium",
            desiredCapacity: 3,
            minSize: 3,
            maxSize: 6,
            // Do not give the worker nodes public IP addresses
            nodeAssociatePublicIpAddress: false,
        }, opts);
        
        this.kubeConfig = cluster.kubeconfig.apply(s => <string>s);
        this.endpoint = cluster.eksCluster.endpoint;
        this.vpcId = vpc.vpcId;
    }
}