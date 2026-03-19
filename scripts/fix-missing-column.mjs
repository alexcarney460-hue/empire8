import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envFile = readFileSync(envPath, "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) env[key.trim()] = val.join("=").trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Add printed_at column — use Supabase Management API
try {
  const mgmtRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Supabase connected");
} catch (e) {
  console.log("Note:", e.message);
}

// Check orders
const { data: orders, error } = await supabase
  .from("orders")
  .select("id, email, status, total, created_at")
  .order("created_at", { ascending: false })
  .limit(5);

if (error) {
  console.log("Orders query error:", error.message);
} else {
  console.log(`Orders in DB: ${orders.length}`);
  orders.forEach(o => console.log(`  id=${o.id} email=${o.email} status=${o.status} total=${o.total}`));
}
