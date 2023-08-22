import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface GkeClusterArgs {
    gcpProject: string;
    gcpRegion: string;
    cidrBlock: string;
    nodesPerZone: number;
    desiredCapacity: number;
    allowPublicNodeIpAddress?: boolean;
}

export class GkeCluster extends pulumi.ComponentResource {

    public readonly kubeConfig: pulumi.Output<string>;
    public readonly endpoint: pulumi.Output<string>;
    public readonly vpcId: pulumi.Output<string>;

    constructor(name: string, args: GkeClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("cluster:gcp:gkeCluster", name, args, opts);

        // Create a new network
        const network = new gcp.compute.Network("gke-network", {
            autoCreateSubnetworks: false,
            description: "A virtual network for your GKE cluster(s)",
        });

        // Create a new subnet in the network created above
        const subnetwork = new gcp.compute.Subnetwork("gke-subnet", {
            ipCidrRange: args.cidrBlock,
            network: network.id,
            privateIpGoogleAccess: true,
        });

        this.vpcId = subnetwork.id;

        // Create a new GKE cluster
        const cluster = new gcp.container.Cluster("gke-cluster", {
            addonsConfig: {
                dnsCacheConfig: {
                    enabled: true,
                },
            },
            binaryAuthorization: {
                evaluationMode: "PROJECT_SINGLETON_POLICY_ENFORCE",
            },
            datapathProvider: "ADVANCED_DATAPATH",
            description: "A GKE cluster",
            initialNodeCount: 1,
            ipAllocationPolicy: {
                clusterIpv4CidrBlock: "/14",
                servicesIpv4CidrBlock: "/20",
            },
            location: args.gcpRegion,
            masterAuthorizedNetworksConfig: {
                cidrBlocks: [{
                    cidrBlock: "0.0.0.0/0",
                    displayName: "All networks",
                }],
            },
            network: network.name,
            networkingMode: "VPC_NATIVE",
            privateClusterConfig: {
                enablePrivateNodes: true,
                enablePrivateEndpoint: false,
                masterIpv4CidrBlock: "10.255.0.0/28",
            },
            removeDefaultNodePool: true,
            releaseChannel: {
                channel: "STABLE",
            },
            subnetwork: subnetwork.name,
            serviceExternalIpsConfig: {
                enabled: args.allowPublicNodeIpAddress ? args.allowPublicNodeIpAddress! : false,
            },
            workloadIdentityConfig: {
                workloadPool: `${args.gcpProject}.svc.id.goog`,
            },
        });

        // Create a service account for the node pool
        const gkeNodepoolSa = new gcp.serviceaccount.Account("gke-nodepool-sa", {
            accountId: pulumi.interpolate`${cluster.name}-np-1-sa`,
            displayName: "Nodepool 1 Service Account",
        });

        // Create a nodepool for the GKE cluster
        const nodePool = new gcp.container.NodePool("gke-nodepool", {
            cluster: cluster.id,
            nodeCount: args.nodesPerZone,
            nodeConfig: {
                oauthScopes: ["https://www.googleapis.com/auth/cloud-platform"],
                serviceAccount: gkeNodepoolSa.email,
            },
        });

        this.kubeConfig = this.createKubeConfig(cluster, nodePool);
        this.endpoint = cluster.endpoint;
    }

    createKubeConfig(cluster: gcp.container.Cluster, nodePool: gcp.container.NodePool): pulumi.Output<string> {
        return pulumi.jsonStringify({
            apiVersion: "v1",
            clusters: [{
                name: cluster.name,
                cluster: {
                    "certificate-authority-data": cluster.masterAuth.clusterCaCertificate,
                    server: pulumi.interpolate`https://${cluster.endpoint}`
                },
            }],
            contexts: [{
                name: cluster.name,
                context: {
                    cluster: cluster.name,
                    user: cluster.name,
                },
            }],
            "current-context": cluster.name,
            "node-pool": nodePool.id,
            kind: "Config",
            preferences: {},
            users: [{
                name: cluster.name,
                user: {
                    exec: {
                        apiVersion: "client.authentication.k8s.io/v1beta1",
                        command: "gke-gcloud-auth-plugin",
                        installHint: "Install gke-gcloud-auth-plugin for use with kubectl by following https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke",
                        provideClusterInfo: true
                    },
                },
            }]
        })
    }
}