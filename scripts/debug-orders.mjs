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

// Get all columns from orders
const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(2);

if (error) {
  console.log("ERROR:", error.message, error.details, error.hint);
} else {
  console.log(`Found ${data.length} orders\n`);
  for (const o of data) {
    console.log("Columns:", Object.keys(o).join(", "));
    console.log("Data:", JSON.stringify(o, null, 2));
    console.log("---");
  }
}

// Now test the exact query the admin endpoint uses
const cols = [
  'id', 'contact_id', 'email', 'status', 'total',
  'shipping_name', 'shipping_address_line1', 'shipping_address_line2',
  'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_country',
  'label_url', 'tracking_number', 'tracking_url',
  'shipping_carrier', 'shipping_service', 'shipping_cost',
  'shipping_status', 'shipped_at', 'label_created_at',
  'created_at', 'updated_at',
].join(', ');

const { data: d2, error: e2 } = await supabase.from("orders").select(cols).order("created_at", { ascending: false }).limit(2);

if (e2) {
  console.log("\nAdmin query ERROR:", e2.message, e2.details, e2.hint);

  // Try with just basic columns
  const { data: d3, error: e3 } = await supabase.from("orders").select("id, email, status, total, created_at").order("created_at", { ascending: false }).limit(2);
  if (e3) {
    console.log("Basic query ERROR:", e3.message);
  } else {
    console.log("\nBasic query works:", d3.length, "orders");
  }
} else {
  console.log("\nAdmin query works:", d2.length, "orders");
}
