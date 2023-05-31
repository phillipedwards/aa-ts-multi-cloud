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
const pulumi = require("@pulumi/pulumi");
const s3Website_1 = require("./websites/s3Website");
const clouds = ["aws", "azure", "gcp"];
module.exports = () => __awaiter(void 0, void 0, void 0, function* () {
    const config = new pulumi.Config();
    const cloud = config.require("cloud-provider");
    const tags = {
        "stack": pulumi.getStack(),
        "project": pulumi.getProject(),
        "organization": pulumi.getOrganization()
    };
    switch (cloud) {
        case "aws":
            new s3Website_1.S3Website("s3website", {
                content: "",
                stackName: pulumi.getStack(),
                tags: tags
            });
            break;
        case "gcp":
            break;
        case "azure":
            break;
        default:
            throw new Error(`Unsupported cloud ${cloud} encountered. Use AWS, AZURE, or GCP`);
    }
});
//# sourceMappingURL=index.js.map