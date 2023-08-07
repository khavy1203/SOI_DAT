import express from "express";

require("dotenv").config();
const routes = express.Router();

const apiRoutes = (app) => {

  routes.get("/userPage", homeController.handleUserPage);
  return app.use("/api/v2/", routes);
};
export default apiRoutes;
