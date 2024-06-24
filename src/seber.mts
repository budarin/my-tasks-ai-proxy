import path from "path";
import fs from "fs";

const pem = fs
  .readFileSync(path.resolve("./certs/russian_trusted_root_ca.cer"))
  .toString();

process.env.NODE_EXTRA_CA_CERTS = pem;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function get_sber_token(): SberTokenResult {
  console.log("process.env.SBER_KEY", process.env.SBER_KEY);

  try {
    const result = await fetch(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: "04633e8d-50d2-4868-ad3e-803b779106e9",
          Authorization: `Basic ${process.env.SBER_KEY}`,
        },
        body: new URLSearchParams({
          scope: "GIGACHAT_API_PERS",
        }),
      }
    ).then((resp) => resp.json());

    console.log("result", result);

    return {
      result,
    };
  } catch (error) {
    console.log("error", error);

    return {
      error: error as Error,
    };
  }
}
