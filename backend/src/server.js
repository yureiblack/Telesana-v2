const app = require('./app')
require("dotenv").config()

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log("Server Running")
}).on("error", (err) => {
  console.error("Server failed to start:", err)
}) 