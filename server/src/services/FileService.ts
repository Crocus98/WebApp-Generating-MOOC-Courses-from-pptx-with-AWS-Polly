import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import LambdaException from "@/exceptions/LambdaException";
import ElaborationException from "@/exceptions/ElaborationException";
import storageWrapper from "@storage-wrapper";

export const uploadFileToStorage = async (file: any, email: string) => {
    try {
        await storageWrapper.uploadFileToStorageAndDeleteOldOnes(file, email);
    } catch (error) {
        if (error instanceof AwsS3Exception) {
            throw new StorageException(error.message);
        }
        throw new StorageException("Unexpected error. Could not upload file to storage");
    }
}

export const downloadFileFromStorage = async (email: string, original: boolean = false) => {
    try {
        const file = await storageWrapper.getFileFromStorage(email, original);
        return file;
    } catch (error) {
        if (error instanceof AwsS3Exception) {
            throw new StorageException(error.message);
        }
        throw new StorageException("Unexpected error. Could not download file from storage");
    }
}

export const elaborateFile = async (email: string) => {
    try {
        // TODO await lambdaWrapper.elaborateFile(email);
    } catch (error) {
        if (error instanceof AwsS3Exception) {
            throw new StorageException(error.message);
        } else if (error instanceof LambdaException) {
            throw new ElaborationException(error.message);
        }
        throw new ElaborationException("Unexpected error. Could not elaborate file.");
    }
}
