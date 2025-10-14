"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborateSlidesPreview = exports.elaborateAudioPreview = void 0;
const tslib_1 = require("tslib");
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const LambdaException_1 = tslib_1.__importDefault(require("@/exceptions/LambdaException"));
const _elaboration_wrapper_1 = tslib_1.__importDefault(require("@elaboration-wrapper"));
const PreviewException_1 = tslib_1.__importDefault(require("@/exceptions/PreviewException"));
const elaborateAudioPreview = (text) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield _elaboration_wrapper_1.default.elaborateAudioPreview(text);
    }
    catch (error) {
        if (error instanceof LambdaException_1.default) {
            throw new PreviewException_1.default(error.message);
        }
        throw new PreviewException_1.default("Unexpected error. Could not elaborate preview.");
    }
});
exports.elaborateAudioPreview = elaborateAudioPreview;
const elaborateSlidesPreview = (email, projectName) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield _elaboration_wrapper_1.default.elaborateSlidesPreview(email, projectName);
    }
    catch (error) {
        if (error instanceof LambdaException_1.default) {
            throw new PreviewException_1.default(error.message);
        }
        else if (error instanceof StorageException_1.default) {
            throw new PreviewException_1.default(error.message);
        }
        throw new PreviewException_1.default("Unexpected error. Could not elaborate preview.");
    }
});
exports.elaborateSlidesPreview = elaborateSlidesPreview;
