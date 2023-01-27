import { Client } from "pg";
import dotenv from "dotenv";
dotenv.config();
const connectDb = async () => {
  try {
    const client = new Client({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: Number(process.env.PGPORT),
    });
    await client.connect();
    const res = await client.query("SELECT * FROM items");
    console.log(res);
    await client.end();
  } catch (error) {
    console.log(error);
  }
};
connectDb();
