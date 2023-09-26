import AwsS3Exception from "@/exceptions/AwsS3Exception";
import StorageException from "@/exceptions/StorageException";
import elaborationWrapper from "@elaboration-wrapper";
import PreviewException from "@/exceptions/PreviewException";
import MicroserviceException from "@/exceptions/MicroserviceException";
import ParameterException from "@/exceptions/ParameterException";

export const elaborateAudioPreview = (text: string) => {
  try {
    return elaborationWrapper.elaborateAudioPreview(text);
  } catch (error) {
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    } else if (error instanceof ParameterException) {
      throw new ParameterException(error.message);
    }
    throw new PreviewException("Unexpected error. Could not elaborate preview.");
  }
};

export const elaborateSlidesPreview = (email: string, projectName: string) => {
  try {
    return elaborationWrapper.elaborateSlidesPreview(email, projectName);
  } catch (error) {
    if (error instanceof MicroserviceException) {
      throw new PreviewException(error.message);
    } else if (error instanceof ParameterException) {
      throw new ParameterException(error.message);
    } else if (error instanceof AwsS3Exception) {
      throw new StorageException(error.message);
    }
    throw new PreviewException("Unexpected error. Could not elaborate slides preview.");
  }
};
