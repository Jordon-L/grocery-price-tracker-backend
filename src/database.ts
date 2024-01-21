import mariadb from 'mariadb';
import * as dotenv from "dotenv";
import * as express from "express";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { validationResult } from "express-validator";
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});


async function getPrice(request:express.Request, response: express.Response) {
  try {
    const auth = await authKey(request);
    if (!auth) {
      response.status(400).json("bad api key");
      return;
    }
    const location = request.params.location;
    const productSKU = request.params.sku;
    let data = await pool.query(
      `SELECT * FROM prices WHERE product_id = (SELECT id from products WHERE product_sku = ?) 
      AND location_id = (SELECT id from locations WHERE location = ?) ORDER BY date DESC`,
      [productSKU, location]
    );

    const regularPrice = data.filter((elm: any) => elm.tag === "regular" || elm.tag === "sale");
    const limitPrice = data.filter((elm: any) => elm.tag === "limit");
    const multiPrice = data.filter((elm: any) => elm.tag === "multi");

    response.status(200).json({ regularPrice, limitPrice, multiPrice });
  } catch (error) {
    console.error(error);
    response.status(500).json("Internal Server Error");
  }
}

async function getProductId(name:any, brand:any, sku:any) {
  let result = await pool.query(
    `INSERT INTO products (name, brand, product_sku)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      brand = VALUES(brand)
    RETURNING id`,
    [name, brand, sku]
  );
  return result[0].id;
}

async function addPrice(request:express.Request, response: express.Response) {
  try {
    const errors = validationResult(request);
    const auth = await authKey(request);
    if (!auth) {
      response.status(400).json("bad api key");
      return;
    }
    if (!errors.isEmpty()) {
      response.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, brand, price, productSKU, unit, location, tag } = request.body;
    let locationResult = await pool.query("SELECT id from locations WHERE location=?", [location]);

    if (locationResult.length == 0) {
      response.status(500).json("No location");
      return;
    }

    const locationID = locationResult[0].id;
    const productID = await getProductId(name, brand, productSKU);
    const date = new Date();

    await pool.query(
      `CALL insert_or_update_price(?, ?, ?, ?, ?, ?, ?)`,
      [productID, locationID, date, Number(price), unit, tag, date]
    );

    response.status(200).json("Price added or updated successfully");
  } catch (error) {
    console.error(error);
    response.status(500).json("Internal Server Error");
  }
}

async function addProduct(request:express.Request, response: express.Response) {
  const errors = validationResult(request);
  const auth = await authKey(request);
  if (!auth) {
    response.status(400).json("bad api key");
    return;
  }
  if (!errors.isEmpty()) {
    response.status(400).json({ errors: errors.array() });
    return;
  }
  const { name, brand, productSKU, link } = request.body;

  try {
    await pool.query(
      `INSERT INTO products (name, brand, product_sku, link)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        brand = VALUES(brand),
        link = VALUES(link)`,
      [name, brand, productSKU, link]
    );
    response.status(200).json("Product added or updated successfully");
  } catch (error) {
    console.error(error);
    response.status(500).json("Internal Server Error");
  }
}

async function generateAPIKey(_request:express.Request, response: express.Response) {
  try {
    const user_id = crypto.randomUUID();
    const saltRounds = 10;
    const api_key = crypto.randomUUID();
    const hashedToken = await bcrypt.hash(api_key, saltRounds);

    await pool.query(
      "INSERT INTO api_keys (user_id, hash_key) VALUES (?, ?)",
      [user_id, hashedToken]
    );

    response.status(200).json({ user_id, api_key });
  } catch (error) {
    console.error(error);
    response.status(500).json("Internal Server Error");
  }
}
async function waitForApiKey() {
  try {
    let results = await pool.query("SELECT * FROM api_keys");
    return results[0]; 
  } catch (error) {
    console.error(error);
    throw error; // Or handle it as per your application's error handling policy
  }
}

async function authKey(request: express.Request) {
  let api_key = request.header("x-api-key"); //Add API key to headers
  return await waitForApiKey().then((value: any) => {
    if (api_key == undefined) {
      return false;
    }
    const results = bcrypt.compareSync(api_key, value.hash_key as string);
    return results;
  });
}

export { getPrice, addPrice, generateAPIKey, authKey, addProduct };
