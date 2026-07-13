import fs from "node:fs";
import EmbeddedPostgres from "embedded-postgres";

// Local dev Postgres for verification (real PG binary, standard TCP port).
const dataDir = "./.pgdata";
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5433,
  persistent: true,
});

const initialised = fs.existsSync(`${dataDir}/PG_VERSION`);
if (!initialised) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("creators");
  console.log("created database 'creators'");
} catch {
  console.log("database 'creators' already exists");
}
console.log("✅ Postgres up on postgresql://postgres:postgres@localhost:5433/creators");

// keep the process (and server) alive
process.stdin.resume();
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
