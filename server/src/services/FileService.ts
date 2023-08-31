import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import LambdaException from "@/exceptions/LambdaException";
import ElaborationException from "@/exceptions/ElaborationException";
import storageWrapper from "@storage-wrapper";
import elaborationWrapper from "@elaboration-wrapper";
import { Project } from "@prisma/client";
import { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import MicroserviceException from "@/exceptions/MicroserviceException";

export const uploadFileToStorage = async (file: any, projectName: string, email: string) => {
  try {
    await storageWrapper.uploadFileToStorageAndDeleteOldOnes(file, projectName, email);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not upload file to storage");
  }
};

export const downloadFileFromStorage = async (
  email: string,
  projectName: string,
  original = false
): Promise<GetObjectCommandOutput> => {
  try {
    const file = await storageWrapper.getFileFromStorage(email, projectName, original);
    return file;
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not download file from storage");
  }
};

export const elaborateFile = async (project: Project, email: string) => {
  try {
    await elaborationWrapper.elaborateFile(project, email);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    } else if (error instanceof MicroserviceException) {
      throw new ElaborationException(error.message);
    }
    throw new ElaborationException("Unexpected error. Could not elaborate file.");
  }
};

export const deleteFilesByProjectName = async (email: string, projectName: string) => {
  try {
    await storageWrapper.deleteFilesFromStorageByUserEmailAndProjectName(email, projectName);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not elaborate file.");
  }
};
