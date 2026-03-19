import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname, "../.env.local");
const envFile = readFileSync(envPath, "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) env[key.trim()] = val.join("=").trim();
});

const token = env.SQUARE_ACCESS_TOKEN;
console.log("Token length:", token.length);

// Get recent payments
const res = await fetch("https://connect.squareup.com/v2/payments?sort_order=DESC&limit=5", {
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
});
const data = await res.json();

if (data.payments && data.payments.length > 0) {
  console.log(`Found ${data.payments.length} payments:`);
  for (const p of data.payments) {
    console.log(`  id=${p.id} status=${p.status} amount=${p.amount_money?.amount} email=${p.buyer_email_address} created=${p.created_at}`);
  }
} else {
  console.log("No payments found");
  console.log("Response:", JSON.stringify(data, null, 2));
}

// Check webhook subscriptions
const whRes = await fetch("https://connect.squareup.com/v2/webhooks/subscriptions", {
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
});
const whData = await whRes.json();
console.log("\nWebhook subscriptions:", JSON.stringify(whData, null, 2));
