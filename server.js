require("dotenv").config();

const server = require("./src/app");

server.listen(process.env.PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${process.env.PORT}`);
});