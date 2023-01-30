import express from "express";
import { addPrice, generateAPIKey, getPrice } from "./database.js";
import { body} from "express-validator";
import cors from 'cors';

const allowedOrigins = ['chrome-extension://kjbcickehfpoejmaiokdagfcbligmelk'];

const options: cors.CorsOptions = {
  origin: allowedOrigins
};

const app = express();
app.use(cors(options));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;

app.get("/", (_req, res) => res.send("Hello World!"));

app.get("/api/new", generateAPIKey);

app.get(
  "/api/price/:location/:sku",
  getPrice
);

app.post(
  "/api/price",
  body(["name", "brand", "productSKU", "location", "price", "unit", "tag"]).exists({
    checkNull: true,
    checkFalsy: true,
  }),
  addPrice
);


app.listen(port, () => console.log(`Example app listening on port ${port}!`));

export {};
