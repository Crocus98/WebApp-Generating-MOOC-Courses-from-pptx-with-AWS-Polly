"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsWrapper = exports.Utils = void 0;
const tslib_1 = require("tslib");
const utils_1 = tslib_1.__importDefault(require("./utils"));
exports.Utils = utils_1.default;
const storageWrapper_1 = tslib_1.__importDefault(require("./storageWrapper"));
exports.AwsWrapper = storageWrapper_1.default;
