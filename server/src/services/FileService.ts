import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import storageWrapper from "@storage-wrapper";

export const uploadFileToStorage = async (file: any, email: string) => {
    try {
        await storageWrapper.uploadFileToStorageAndDeleteOldOnes(file, email);
    } catch (error) {
        if (error instanceof AwsS3Exception) {
            throw new StorageException(error.message);
        }
        throw new StorageException("Unexpected errror. Could not upload file to storage");
    }
}
