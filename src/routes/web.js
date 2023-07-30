import express from "express";
import homeController from "../controller/homeController"
const routes = express.Router();

const initWebRoutes = (app) => {
    routes.get("/home", homeController.handleHelloWord);
    routes.get("/userPage", homeController.handleUserPage);
    return app.use("/", routes);
}
export default initWebRoutes;