import * as pulumi from "@pulumi/pulumi";
export interface createProgramArgs {
    stackName: string;
    tags: {
        [key: string]: string;
    };
    content: string;
}
export declare const createPulumiProgram: (args: createProgramArgs) => () => Promise<{
    websiteUrl: pulumi.Output<string>;
}>;
