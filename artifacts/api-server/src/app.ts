import express, { type Express, Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: '2mb' })); // Support base64 images up to 2MB
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use("/api", router);

// Serve static files from frontend build
const frontendPath = path.join(__dirname, "../../mawashi-bahrain/dist/public");
app.use(express.static(frontendPath));

// SPA fallback - serve index.html for all non-API routes
app.get("{*path}", (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
