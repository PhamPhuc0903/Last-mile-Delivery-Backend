import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || "tracking-service";

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} started on port ${PORT}`);
})