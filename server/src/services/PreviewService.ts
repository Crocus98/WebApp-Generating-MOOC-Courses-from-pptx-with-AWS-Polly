import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import LambdaException from "@/exceptions/LambdaException";
import ElaborationException from "@/exceptions/ElaborationException";
import storageWrapper from "@storage-wrapper";
import elaborationWrapper from "@elaboration-wrapper";
import { Project } from "@prisma/client";
import { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import PreviewException from "@/exceptions/PreviewException";
import MicroserviceException from "@/exceptions/MicroserviceException";

export const elaborateAudioPreview = async (text: string) => {
  try {
    return await elaborationWrapper.elaborateAudioPreview(text);
  } catch (error) {
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    }
    throw new PreviewException("Unexpected error. Could not elaborate preview.");
  }
};

export const elaborateSlidesPreview = async (email: string, projectName: string) => {
  try {
    return await elaborationWrapper.elaborateSlidesPreview(email, projectName);
  } catch (error) {
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    } else if (error instanceof StorageException) {
      throw new PreviewException(error.message);
    }
    throw new PreviewException("Unexpected error. Could not elaborate preview.");
  }
};
