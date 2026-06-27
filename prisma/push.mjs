import {
  getPrismaSchemaPath,
  isPostgresDatabase,
  requireDatabaseUrl,
  runNodeScript,
  runPrisma
} from "./schema-utils.mjs";

const databaseUrl = requireDatabaseUrl();
const schemaPath = getPrismaSchemaPath({ requireUrl: true });

if (isPostgresDatabase(databaseUrl)) {
  console.log("Preparing PostgreSQL database with Prisma db push");
  runPrisma(["db", "push", "--schema", schemaPath]);
} else {
  console.log("Preparing local SQLite database");
  runPrisma(["generate", "--schema", schemaPath]);
  runNodeScript("prisma/setup.mjs", process.argv.slice(2));
}
