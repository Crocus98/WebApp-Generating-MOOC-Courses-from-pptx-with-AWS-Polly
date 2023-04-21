import StorageException from "@/exceptions/StorageException";
import storageWrapper from "@storage-wrapper";

export const uploadFileToStorage = async (file: any, email: string) => {
    const result = await storageWrapper.uploadFileToStorage(file, email);
    if (!result) {
        throw new StorageException("Could not upload file to storage");
    }
    return result;
}
