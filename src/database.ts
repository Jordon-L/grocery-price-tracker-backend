import pkg from "pg";
const { Pool } = pkg;
import * as dotenv from "dotenv";
import * as express from "express";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { validationResult } from "express-validator";
dotenv.config();

const pool = new Pool({
  // user: process.env.user,
  // host: process.env.host,
  // database: process.env.database,
  // password: process.env.password,
  // port: Number(process.env.port),
  connectionString: process.env.DATABASE_URL,
});

function getPrice(request: express.Request, response: express.Response) {
  if (!authKey(request)) {
    response.status(400).json("bad api key");
    return;
  }
  const location = request.params.location;
  const productSKU = request.params.sku;
  console.log(location, productSKU);
  pool.query(
    `SELECT * FROM prices WHERE product_id = (SELECT id from products WHERE product_sku = $1) 
    AND location_id = (SELECT id from locations WHERE location = $2) ORDER BY date DESC`,
    [productSKU, location],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
}

function addPrice(request: express.Request, response: express.Response) {
  const errors = validationResult(request);
  if (!authKey(request)) {
    response.status(400).json("bad api key");
    return;
  }
  if (!errors.isEmpty()) {
    response.status(400).json({ errors: errors.array() });
    return;
  }
  const { name, brand, price, productSKU, unit, location, tag } = request.body;
  //check if store location exists
  pool.query(
    "SELECT * from locations WHERE location=$1",
    [location],
    (error, results) => {
      if (error) {
        throw error;
      }
      if (results.rowCount == 0) {
        response.status(500).json("No location");
        return;
      }
      const locationID = results.rows[0].id;
      const date = new Date();
      pool.query(
        `WITH new_product AS (
          INSERT INTO products (name, brand, product_sku)
          VALUES ($1, $2, $3)
          ON CONFLICT (product_sku) DO UPDATE
            SET name = excluded.name
          RETURNING id
        )
        INSERT INTO prices (product_id, location_id, date, price, unit, tag, last_updated)
         VALUES ((SELECT id FROM new_product), $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [
          name,
          brand,
          productSKU,
          locationID,
          date,
          Number(price),
          unit,
          tag,
          date,
        ],
        (error, results) => {
          if (error) {
            response.status(500).json("Internal Server Error");
            throw error;
          } else {
            response.status(200).json(results.rows);
          }
        }
      );
    }
  );
}

async function generateAPIKey(
  request: express.Request,
  response: express.Response
) {
  const { user_id } = request.body;
  const saltRounds = 10;
  const api_key = crypto.randomUUID();
  const hashedToken = await bcrypt.hash(api_key, saltRounds);
  pool.query(
    "INSERT INTO api_keys (user_id, hash_key) VALUES($1, $2)",
    [user_id, hashedToken],
    (error, _results) => {
      if (error) {
        throw error;
      }
      response.status(200).json({ user_id, api_key });
    }
  );
}

function authKey(request: express.Request) {
  let api_key = request.header("x-api-key"); //Add API key to headers
  console.log(api_key);
  if (api_key == undefined) {
    return false;
  }
  console.log(process.env.hash_key);
  const results = bcrypt.compareSync(api_key, process.env.hash_key as string);
  return results;
}

export { getPrice, addPrice, generateAPIKey, authKey };
