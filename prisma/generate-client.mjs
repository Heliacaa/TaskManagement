import { getPrismaSchemaPath, runPrisma } from "./schema-utils.mjs";

const schemaPath = getPrismaSchemaPath();

console.log(`Generating Prisma Client from ${schemaPath}`);
runPrisma(["generate", "--schema", schemaPath]);
