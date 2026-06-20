import { config } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import pg from "pg";

config({ path: [".env.local", ".env"] });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error("DATABASE_URL is not set");
	process.exit(1);
}

async function main() {
	const client = new pg.Client({ connectionString: databaseUrl });
	await client.connect();

	const migrations = readMigrationFiles({
		migrationsFolder: "./src/db/migrations",
	});

	const existing = await client.query(
		"SELECT hash FROM drizzle.__drizzle_migrations",
	);
	const existingHashes = new Set(existing.rows.map((row) => row.hash));

	let inserted = 0;
	for (const migration of migrations) {
		if (existingHashes.has(migration.hash)) continue;
		await client.query(
			"INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)",
			[migration.hash, migration.folderMillis],
		);
		inserted += 1;
		console.log(`Stamped migration ${migration.folderMillis}`);
	}

	await client.end();
	console.log(
		inserted === 0
			? "Migration journal already up to date."
			: `Stamped ${inserted} migration(s).`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
