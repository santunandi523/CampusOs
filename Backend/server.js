const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors")
const app = express();
require("dotenv").config();

app.use(cors())
app.use(express.json())
const port = process.env.PORT;

mongoose.connect(process.env.MONGODB_URL)
.then(console.log("MongoDB Connected!!!!"))
.catch(err => console.log(err))

app.use("/api/auth", require("./Routes/auth"))
app.use("/api/course", require("./Routes/myCourse"))
app.use("/api/assignments", require("./Routes/myAssignments"));
app.use("/api/students", require("./Routes/students"));


app.get("/" ,(req,res) => {
    res.send("Hello World!!");
})

app.listen(port, () => {
    console.log(`App is running on http://localhost:${port}`)
})