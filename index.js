const express = require("express");
const connectDb = require("./config/db");
const { config } = require("dotenv");
require("dotenv").config();
const authRoute = require("./routes/authRoute");
const postRoute = require("./routes/postRoute");
const groupRoute = require("./routes/groupRoute");
const userRoute = require("./routes/userRoute");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());

connectDb();

app.use("/auth", authRoute);
app.use("/users", postRoute);
app.use("/group", groupRoute);
app.use("/user", userRoute);

const PORT = 8080;

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
