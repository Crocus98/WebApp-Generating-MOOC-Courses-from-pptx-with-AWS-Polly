import config from "@config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const uploadFileToS3 = async (file: any, email: string) => {
    try {
        const client = new S3Client({
            region: config.AWS_CONFIG.S3_BUCKET_REGION,
            credentials: {
                accessKeyId: config.AWS_CONFIG.ACCESS_KEY_ID,
                secretAccessKey: config.AWS_CONFIG.SECRET_ACCESS_KEY,
            }
        });

        const command = new PutObjectCommand({
            Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
            Key: `${email}/${file.originalname}`,
            Body: file.buffer,
        });

        const result = await client.send(command);
        if (!result) {
            return false;
        }
        return result;
    } catch (error) {
        return false;
    }
}
