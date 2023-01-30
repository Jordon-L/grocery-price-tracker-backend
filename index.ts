import * as express from "express";
import { addPrice, generateAPIKey, getPrice } from "./database";
import { body} from "express-validator";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3000;

app.get("/", (req, res) => res.send("Hello World!"));

app.get("/api/new", generateAPIKey);

app.get(
  "/api/price",
  body(["productSKU", "location"]).exists({
    checkNull: true,
    checkFalsy: true,
  }),
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

app.post("api/:sku");

app.put("api/price/:sku");

app.delete("api/price/:sku");

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

export {};