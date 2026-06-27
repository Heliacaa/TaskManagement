import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");
export const sqliteSchemaPath = path.join(projectRoot, "prisma/schema.prisma");
export const postgresSchemaPath = path.join(
  projectRoot,
  "prisma/schema.postgres.prisma"
);

function stripQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function readDotEnvValue(name) {
  const envPath = path.join(projectRoot, ".env");

  if (!existsSync(envPath)) {
    return undefined;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();

    if (key === name) {
      return stripQuotes(trimmed.slice(separatorIndex + 1));
    }
  }

  return undefined;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || readDotEnvValue("DATABASE_URL");
}

export function requireDatabaseUrl() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is missing. Add it to .env locally and to Vercel Project Settings > Environment Variables for deployments."
    );
    process.exit(1);
  }

  return databaseUrl;
}

export function isPostgresDatabase(databaseUrl = getDatabaseUrl()) {
  return (
    databaseUrl?.startsWith("postgresql://") ||
    databaseUrl?.startsWith("postgres://")
  );
}

export function getPrismaSchemaPath({ requireUrl = false } = {}) {
  const databaseUrl = requireUrl ? requireDatabaseUrl() : getDatabaseUrl();
  return isPostgresDatabase(databaseUrl) ? postgresSchemaPath : sqliteSchemaPath;
}

export function runPrisma(args) {
  const executable = process.platform === "win32" ? "prisma.cmd" : "prisma";
  const localPrisma = path.join(projectRoot, "node_modules/.bin", executable);
  const command = existsSync(localPrisma) ? localPrisma : executable;
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export function runNodeScript(scriptPath, args = []) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
