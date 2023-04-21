import config from "@config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

class StorageWrapper {
    private static storageWrapper?: StorageWrapper;
    private s3client?: S3Client;

    constructor() {
        if (!this.s3client) {
            this.s3client = new S3Client({
                region: config.AWS_CONFIG.S3_BUCKET_REGION,
                credentials: {
                    accessKeyId: config.AWS_CONFIG.ACCESS_KEY_ID,
                    secretAccessKey: config.AWS_CONFIG.SECRET_ACCESS_KEY,
                }
            });
        }
    }

    async uploadFileToStorage(file: any, email: string) {
        try {
            const command = new PutObjectCommand({
                Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
                Key: `${email}/${file.originalname}`,
                Body: file.buffer,
            });

            const result = await this.s3client?.send(command);
            if (!result) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    static getInstance(): StorageWrapper {
        if (!this.storageWrapper) this.storageWrapper = new StorageWrapper();
        return this.storageWrapper;
    }
}

export default StorageWrapper.getInstance();