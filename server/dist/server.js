"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _logger_1 = require("@logger");
const _config_1 = tslib_1.__importDefault(require("@config"));
const express_1 = tslib_1.__importDefault(require("express"));
const http_1 = tslib_1.__importDefault(require("http"));
const log4js_1 = require("log4js");
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const _routes_1 = tslib_1.__importDefault(require("@routes"));
const path_1 = tslib_1.__importDefault(require("path"));
const cors_1 = tslib_1.__importDefault(require("cors"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = new http_1.default.Server(this.app);
    }
    includeRoutes() {
        this.app.use(_routes_1.default);
    }
    includeConfig() {
        this.app.use((0, cors_1.default)());
        this.app.use((0, log4js_1.connectLogger)(_logger_1.express, { level: _config_1.default.LOG_LEVEL.levelStr }));
        const sizeLimit = "20mb";
        this.app.use((0, helmet_1.default)());
        this.app.use(express_1.default.json({ limit: sizeLimit }));
        this.app.use(express_1.default.urlencoded({ limit: sizeLimit, extended: true }));
        this.app.disable("x-powered-by");
    }
    serveClient() {
        const clientBuildPath = path_1.default.join(__dirname, "..", "clientBuild");
        console.log(clientBuildPath);
        this.app.use(express_1.default.static(clientBuildPath));
        this.app.get("/*", function (req, res) {
            res.sendFile(path_1.default.join(clientBuildPath, "index.html"));
        });
    }
    start() {
        this.includeConfig();
        this.includeRoutes();
        this.serveClient();
        const port = _config_1.default.SERVER_PORT;
        this.server.listen(port, () => {
            _logger_1.express.info(`Server started on port ${port}`);
        });
    }
}
exports.default = new Server();
