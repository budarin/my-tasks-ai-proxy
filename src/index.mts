import express from "express";
import { get_sber_token } from "./seber.mjs";

const port = 5000;
const app = express();
let sberToken: SberToken;

app.use(express.static("dist/client"));
app.use(express.json());

// ------------------------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).send("Ok");
});

app.post("/process_task", async (req, res) => {
  const data = req.body;

  // Если жить токену осталось меньше 5сек или срок истек - перезапрашиваем токн
  if (!sberToken || Date.now() - sberToken.expires_at < 5000) {
    const result = await get_sber_token();

    if (result.error) {
      res.status(400).json({
        message: "Ошибка получения токена",
      });
    }

    sberToken = result.result;
  }
});

// ------------------------------------------------------------------

app.listen(port, () => {
  console.log(`Сервер Proxy-AI запущен на http://localhost:${port}`);
});
