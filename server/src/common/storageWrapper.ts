import config from "@config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import AwsS3Exception from "@/exceptions/AwsS3Exception";

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
        },
      });
    }
  }

  async uploadFileToStorageAndDeleteOldOnes(
    file: any,
    projectName: string,
    email: string
  ) {
    try {
      await this.deleteFilesFromStorageByUserEmailAndProjectName(
        email,
        projectName
      );
      await this.uploadFileToStorage(file, email, projectName);
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception("Unexpected error. Could not upload file to S3");
    }
  }

  async uploadFileToStorage(file: any, email: string, projectName: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
        Key: `${email}/${projectName}/${file.originalname}`,
        Body: file.buffer,
      });
      const result = await this.s3client?.send(command);
      if (result?.$metadata.httpStatusCode !== 200) {
        throw new AwsS3Exception("Could not upload file to S3");
      }
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception("Unexpected error. Could not upload file to S3");
    }
  }

  async getFileNamesFromStorageByUserEmailAndProject(
    email: string,
    projectName?: string
  ) {
    try {
      const prefix = projectName ? `${email}/${projectName}/` : `${email}/`;
      const listCommand = new ListObjectsCommand({
        Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
        Prefix: prefix,
      });
      const result = await this.s3client?.send(listCommand);
      if (result?.$metadata.httpStatusCode !== 200) {
        throw new AwsS3Exception("Could not get file names from S3.");
      }
      const objectKeys = result?.Contents?.map((obj) => ({ Key: obj.Key }));
      return objectKeys;
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception(
        "Unexpected error. Could not get file names from S3."
      );
    }
  }

  async getFileNameFromStorageByUserEmailAndProject(
    email: string,
    projectName: string
  ) {
    try {
      const objectKeys =
        await this.getFileNamesFromStorageByUserEmailAndProject(
          email,
          projectName
        );
      const fileName = objectKeys?.find(
        (obj) => !obj.Key?.includes("/edited/")
      )?.Key;

      if (!fileName) {
        throw new AwsS3Exception("Could not get file name from S3.");
      }

      return fileName.substring(fileName.lastIndexOf("/") + 1);
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception(
        "Unexpected error. Could not get file name from S3."
      );
    }
  }

  async deleteFilesFromStorageByUserEmailAndProjectName(
    email: string,
    projectName: string
  ) {
    try {
      const objectKeys =
        await this.getFileNamesFromStorageByUserEmailAndProject(
          email,
          projectName
        );
      if (!objectKeys || objectKeys.length === 0) {
        return;
      }
      const command = new DeleteObjectsCommand({
        Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
        Delete: { Objects: objectKeys },
      });

      const result = await this.s3client?.send(command);
      if (result?.$metadata.httpStatusCode !== 200) {
        throw new AwsS3Exception("Could not delete files from storage");
      }
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception(
        "Unexpected error. Could not delete files from storage"
      );
    }
  }

  async getFileFromStorage(
    email: string,
    projectName: string,
    original = false
  ): Promise<any> {
    try {
      const objectKeys =
        await this.getFileNamesFromStorageByUserEmailAndProject(
          email,
          projectName
        );
      const fileName = original
        ? objectKeys?.find(
            (obj) =>
              !obj.Key?.includes("/edited/") && obj.Key?.includes(".pptx")
          )?.Key
        : objectKeys?.find(
            (obj) => obj.Key?.includes("/edited/") && obj.Key?.includes(".pptx")
          )?.Key;
      if (!fileName) {
        throw new AwsS3Exception("The file is not present in S3.");
      }
      const getCommand = new GetObjectCommand({
        Bucket: config.AWS_CONFIG.S3_BUCKET_NAME,
        Key: fileName,
      });
      const result = await this.s3client?.send(getCommand);
      if (result?.$metadata.httpStatusCode !== 200 || !result.Body) {
        throw new AwsS3Exception(
          "Could not get the specified file from S3. No file found."
        );
      }
      return result.Body;
    } catch (error) {
      if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new AwsS3Exception("Unexpected error. Could not get file from S3");
    }
  }

  static getInstance(): StorageWrapper {
    if (!this.storageWrapper) this.storageWrapper = new StorageWrapper();
    return this.storageWrapper;
  }
}

export default StorageWrapper.getInstance();
