import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

function parseEnv(content) {
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadLocalEnv() {
  try {
    const content = await readFile(resolve(root, ".env.local"), "utf8");
    return parseEnv(content);
  } catch {
    return {};
  }
}

function getProjectRef(supabaseUrl) {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return "";
  }
}

function dollarQuote(value) {
  let tag = "codex";

  while (value.includes(`$${tag}$`)) {
    tag += "_x";
  }

  return `$${tag}$${value}$${tag}$`;
}

function redact(value) {
  return value
    .replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_***")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_***");
}

async function runQuery({ projectRef, accessToken, label, query }) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${redact(body)}`);
  }

  console.log(`${label}: ok`);
}

async function verifyTables({ supabaseUrl, serviceRoleKey }) {
  if (!serviceRoleKey) {
    console.log("verify: skipped because SUPABASE_SERVICE_ROLE_KEY is missing");
    return;
  }

  let lastError = "";

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email,role&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });

    if (response.ok) {
      console.log("verify: profiles endpoint is reachable");
      return;
    }

    lastError = `HTTP ${response.status}: ${redact(await response.text())}`;

    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }

  throw new Error(`verify failed with ${lastError}`);
}

const fileEnv = await loadLocalEnv();
const env = { ...fileEnv, ...process.env };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const adminEmail = env.SUPABASE_BOOTSTRAP_ADMIN_EMAIL;
const projectRef = getProjectRef(supabaseUrl);

if (!supabaseUrl || !projectRef) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or invalid.");
}

if (!accessToken) {
  throw new Error(
    [
      "SUPABASE_ACCESS_TOKEN is missing.",
      "Create a Supabase personal access token from the account page, add it to .env.local, then run npm run db:setup."
    ].join(" ")
  );
}

const migrationSql = await readFile(resolve(root, "supabase/migrations/001_initial_schema.sql"), "utf8");
const seedSql = await readFile(resolve(root, "supabase/seed.sql"), "utf8");

await runQuery({
  projectRef,
  accessToken,
  label: "migration",
  query: migrationSql
});

await runQuery({
  projectRef,
  accessToken,
  label: "seed",
  query: seedSql
});

if (adminEmail) {
  await runQuery({
    projectRef,
    accessToken,
    label: "admin bootstrap",
    query: `
      update public.profiles
      set role = 'admin', active = true
      where lower(email) = lower(${dollarQuote(adminEmail)});

      notify pgrst, 'reload schema';
    `
  });
} else {
  console.log("admin bootstrap: skipped because SUPABASE_BOOTSTRAP_ADMIN_EMAIL is missing");
}

await verifyTables({
  supabaseUrl,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
});

console.log("Supabase setup completed.");
