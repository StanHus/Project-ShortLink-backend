import { Pool } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { nanoid } from 'nanoid'

config(); 

const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const pool = new Pool(dbConfig);
pool.connect();

app.get('/', async (req, res) => {
  const links = await pool.query(
    "SELECT oldlink, newlink FROM links ORDER BY id desc LIMIT 10"
  );
  res.json(links.rows)
})

app.get('/:newLink', async (req, res) => {
  const newLink = req.params.newLink
  const urlJson = await pool.query(
    "SELECT oldlink FROM links WHERE newlink_id = $1",
    [newLink]
  );

    if(urlJson){
      res.redirect(urlJson.rows[0].oldlink)
      res.status(200)
    }
    else {
      res.status(404).json({
        status: "fail",
      data: {
        newLink: "Couldnt find the website with this link"
      }})
    }
});


app.post("/", async (req, res) => { //main page
  try {
    const { input } = req.body;
    const id = nanoid(4)
    const url = `https://warm-brushlands-45153.herokuapp.com/${id}`
    const ans = await pool.query(
      "INSERT INTO links (oldlink, newlink_id, newlink) VALUES($1, $2, $3) RETURNING oldlink, newlink",
      [input, id, url]
    );
    res.json(ans.rows[0]);
  } catch (err) {
    res.status(500).send(err)
  }
});

const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

