import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface NginxArgs {
    kubeConfig: pulumi.Output<string>;
}

export class Nginx extends pulumi.ComponentResource {

    public readonly endpoint: pulumi.Output<string>;
    public readonly ip: pulumi.Output<string>;

    constructor(name: string, args: NginxArgs, opts?: pulumi.ComponentResourceOptions) {
        super("kubernetes:k8s:ingress", name, args, opts);

        const namespaceName = name;
        const provider = new k8s.Provider("k8s", {
            kubeconfig: args.kubeConfig,
            deleteUnreachable: true,
        }, { parent: this });

        opts = pulumi.mergeOptions(opts, { parent: this, provider: provider });

        // Create a Kubernetes Namespace
        const ns = new k8s.core.v1.Namespace(name, {
            metadata: {
                name: namespaceName
            }
        }, pulumi.mergeOptions(opts, { deleteBeforeReplace: true }));

        // Create a NGINX Deployment
        const appLabels = { appClass: name };
        const deployment = new k8s.apps.v1.Deployment(name,
            {
                metadata: {
                    namespace: ns.metadata.name,
                    labels: appLabels,
                },
                spec: {
                    replicas: 1,
                    selector: { matchLabels: appLabels },
                    template: {
                        metadata: {
                            labels: appLabels,
                        },
                        spec: {
                            containers: [
                                {
                                    name: name,
                                    image: "nginx:latest",
                                    ports: [{ name: "http", containerPort: 80 }],
                                },
                            ],
                        },
                    },
                },
            }, opts
        );

        // Create a LoadBalancer Service for the NGINX Deployment
        const service = new k8s.core.v1.Service(name,
            {
                metadata: {
                    labels: appLabels,
                    namespace: ns.metadata.name,
                },
                spec: {
                    type: "LoadBalancer",
                    ports: [{ port: 80, targetPort: "http" }],
                    selector: appLabels,
                },
            }, opts
        );

        const ingress = service.status.loadBalancer.ingress[0];
        this.endpoint = ingress.hostname;
        this.ip = ingress.ip;
    }
}