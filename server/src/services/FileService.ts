import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import ElaborationException from "@/exceptions/ElaborationException";
import storageWrapper from "@storage-wrapper";
import elaborationWrapper from "@elaboration-wrapper";
import { Project } from "@prisma/client";
import { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import MicroserviceException from "@/exceptions/MicroserviceException";
import ParameterException from "@/exceptions/ParameterException";

export const uploadFileToStorage = (file: any, projectName: string, email: string) => {
  try {
    storageWrapper.uploadFileToStorageAndDeleteOldOnes(file, projectName, email);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not upload file to storage");
  }
};

export const downloadFileFromStorage = (
  email: string,
  projectName: string,
  original = false
): Promise<GetObjectCommandOutput> => {
  try {
    const file = storageWrapper.getFileFromStorage(email, projectName, original);
    return file;
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not download file from storage");
  }
};

export const elaborateFile = (project: Project, email: string) => {
  try {
    elaborationWrapper.elaborateFile(project, email);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    } else if (error instanceof MicroserviceException) {
      throw new ElaborationException(error.message);
    } else if (error instanceof ParameterException) {
      throw new ParameterException(error.message);
    }
    throw new ElaborationException("Unexpected error. Could not elaborate file.");
  }
};

export const deleteFilesByProjectName = (email: string, projectName: string) => {
  try {
    storageWrapper.deleteFilesFromStorageByUserEmailAndProjectName(email, projectName);
  } catch (error) {
    if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new StorageException("Unexpected error. Could not delete file.");
  }
};
