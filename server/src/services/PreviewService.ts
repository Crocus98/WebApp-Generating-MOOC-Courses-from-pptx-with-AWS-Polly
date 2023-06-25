import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import LambdaException from "@/exceptions/LambdaException";
import ElaborationException from "@/exceptions/ElaborationException";
import storageWrapper from "@storage-wrapper";
import elaborationWrapper from "@elaboration-wrapper";
import { Project } from "@prisma/client";
import { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import PreviewException from "@/exceptions/PreviewException";

export const elaborateAudioPreview = async (text: string) => {
    try {
        return await elaborationWrapper.elaborateAudioPreview(text);
    } catch (error) {
        if (error instanceof LambdaException) {
            throw new PreviewException(error.message);
        }
        throw new PreviewException("Unexpected error. Could not elaborate preview.");
    }
};