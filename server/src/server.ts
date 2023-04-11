import { express as expressLogger } from "@logger";
import config from "@config";
import express, { Request, Response } from "express";
import http from "http";
import { connectLogger } from "log4js";
import helmet from "helmet";
import routes from "@routes";
import HttpException from "@exceptions/HttpException";
import path from "path";

class Server {
  private app: express.Application;
  private server: http.Server;

  constructor() {
    this.app = express();
    this.server = new http.Server(this.app);
  }

  private genericHandler(req: Request, res: Response) {
    const error = new HttpException("Not Found", 404);
    return error.sendError(res);
  }

  private errorHandler(error: HttpException, req: Request, res: Response) {
    return error.sendError(res);
  }

  private includeRoutes() {
    this.app.use(routes);
  }

  private includeConfig() {
    this.app.use(
      connectLogger(expressLogger, { level: config.LOG_LEVEL.levelStr })
    );
    const sizeLimit = "20mb";
    // Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help!
    this.app.use(helmet());
    this.app.use(express.json({ limit: sizeLimit }));
    this.app.use(express.urlencoded({ limit: sizeLimit, extended: true }));
    this.app.disable("x-powered-by");
  }

  private includeHandlers() {
    //this.app.use(this.genericHandler);
    //this.app.use(this.errorHandler);
  }

  private serveClient() {
    const clientBuildPath = path.join(__dirname, "..", "clientBuild");
    console.log(clientBuildPath);
    this.app.use(express.static(clientBuildPath));
    this.app.get("/*", function (req, res) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  }

  public start() {
    this.includeConfig();
    this.includeRoutes();
    //this.includeHandlers(); // Per ora commentato questo perchè creava problemi.
    //Ho capito che serviva anche a gestire il 404. Non ho capito a cosa altro servisse però.
    this.serveClient();
    const port = config.SERVER_PORT;
    this.server.listen(port, () => {
      expressLogger.info(`Server started on port ${port}`);
    });
  }
}

export default new Server();
