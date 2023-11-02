import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import elaborationWrapper from "@elaboration-wrapper";
import PreviewException from "@/exceptions/PreviewException";
import MicroserviceException from "@/exceptions/MicroserviceException";
import ParameterException from "@/exceptions/ParameterException";
import { ResponseType } from "axios";

export const elaborateAudioPreview = async (text: string) => {
  try {
    return await elaborationWrapper.elaborateAudioPreview(text);
  } catch (error) {
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    } else if (error instanceof ParameterException) {
      throw new ParameterException(error.message);
    }
    throw new PreviewException(
      "Unexpected error. Could not elaborate preview."
    );
  }
};

export const elaborateSlidesPreview = async (
  email: string,
  projectName: string,
  includeAudio = true,
  includeImages = true,
  responseType?: ResponseType
) => {
  try {
    return await elaborationWrapper.elaborateSlidesPreview(
      email,
      projectName,
      includeAudio,
      includeImages,
      responseType
    );
  } catch (error) {
    console.log(error);
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    } else if (error instanceof ParameterException) {
      throw new ParameterException(error.message);
    } else if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new PreviewException(
      "Unexpected error. Could not elaborate slides preview."
    );
  }
};
