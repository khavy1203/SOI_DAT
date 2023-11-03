import express from 'express';
import bodyParser from "body-parser";
const fileUpload = require('express-fileupload');
import apiRoutes from "./routes/api";
import telegram from './controller/telegramController.js';
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(fileUpload());

telegram(app);

apiRoutes(app);

const PORT = process.env.PORT || 8085;
app.listen(PORT, () => {
  console.log('jwt nodejs and react ' + PORT);
});