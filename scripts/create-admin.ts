// Bootstrap script: create or promote an admin user against the configured DB.
//
// Run with tsx (not raw node) so that tsconfig "paths" aliases like @/ resolve at runtime.
//   npm run admin:create
//   npm run admin:create -- --email=foo@example.com --password=NewPass1! --first-name=Foo --last-name=Bar
//
// If the user already exists, the role is set to "admin" and the password is updated
// to match the value supplied on the command line. If the user has no credential
// account row (e.g., signed up via OAuth), the password update is skipped with a warning.
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { createInterface } from "node:readline/promises";
import { exit, stdin, stdout } from "node:process";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account, user } from "../auth-schema";
import { hashPassword } from "better-auth/crypto";

config({ path: ".env.local" });
config({ path: ".env" });

type CliArgs = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  help: boolean;
  unknown: string[];
};

function printUsage(): void {
  console.log(`Usage: npm run admin:create -- [options]

Options:
  --email=<addr>         Email address for the admin account
  --password=<value>     Password (min 8 chars); will be hidden when prompted
  --first-name=<value>   First name
  --last-name=<value>    Last name
  -h, --help             Show this help

If any field is omitted, the script will prompt for it interactively.
If the user already exists, its role is set to "admin" and the password is updated.`);
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { help: false, unknown: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      out.help = true;
    } else if (a?.startsWith("--email=")) {
      out.email = a.slice("--email=".length);
    } else if (a === "--email") {
      out.email = argv[++i];
    } else if (a?.startsWith("--password=")) {
      out.password = a.slice("--password=".length);
    } else if (a === "--password") {
      out.password = argv[++i];
    } else if (a?.startsWith("--first-name=")) {
      out.firstName = a.slice("--first-name=".length);
    } else if (a === "--first-name") {
      out.firstName = argv[++i];
    } else if (a?.startsWith("--lastName=")) {
      out.firstName = a.slice("--firstName=".length);
    } else if (a === "--firstName") {
      out.firstName = argv[++i];
    } else if (a?.startsWith("--last-name=")) {
      out.lastName = a.slice("--last-name=".length);
    } else if (a === "--last-name") {
      out.lastName = argv[++i];
    } else if (a?.startsWith("--lastName=")) {
      out.lastName = a.slice("--lastName=".length);
    } else if (a === "--lastName") {
      out.lastName = argv[++i];
    } else if (a?.startsWith("--")) {
      out.unknown.push(a);
    }
  }
  return out;
}

async function prompt(
  question: string,
  { silent = false }: { silent?: boolean } = {},
): Promise<string> {
  const options: {
    input: typeof stdin;
    output?: typeof stdout;
    terminal: boolean;
  } = { input: stdin, terminal: !silent };
  if (!silent) {
    options.output = stdout;
  }
  const rl = createInterface(options);
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

const inputSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

async function collectInput(args: CliArgs): Promise<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}> {
  const email = args.email ?? (await prompt("Email: "));
  const password =
    args.password ??
    (await prompt("Password (min 8 chars): ", { silent: true }));
  const firstName = args.firstName ?? (await prompt("First name: "));
  const lastName = args.lastName ?? (await prompt("Last name: "));
  const parsed = inputSchema.safeParse({
    email,
    password,
    firstName,
    lastName,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${issue.path.join(".") || "input"}: ${issue.message}`);
  }
  return parsed.data;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }
  if (args.unknown.length > 0) {
    throw new Error(`Unknown flag(s): ${args.unknown.join(", ")}`);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env.local (or .env) file with DATABASE_URL.",
    );
  }

  const { email, password, firstName, lastName } = await collectInput(args);

  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing.length > 0) {
    const u = existing[0];
    console.log(
      `Account with email ${email} already exists (id=${u.id}). Promoting to admin and updating password.`,
    );

    await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, u.id));

    const hashed = await hashPassword(password);
    const updated = await db
      .update(account)
      .set({ password: hashed })
      .where(
        and(eq(account.userId, u.id), eq(account.providerId, "credential")),
      )
      .returning({ id: account.id });

    if (updated.length === 0) {
      console.warn(
        "No credential account row found for this user. The user may have signed up via OAuth; password was not updated.",
      );
    } else {
      console.log(
        `Password updated on credential account (id=${updated[0].id}).`,
      );
    }

    console.log(`Done. ${u.email} is now an admin.`);
    return;
  }

  const name = `${firstName} ${lastName}`.trim();
  const result = await auth.api.createUser({
    body: { email, name, password, data: { firstName, lastName } },
    headers: new Headers(),
  });

  await db.update(user).set({ role: "ADMIN" }).where(eq(user.email, email));

  console.log(`Created admin user ${result.user.id} (${email}).`);
}

main()
  .then(() => {
    exit(0);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed: ${message}`);
    exit(1);
  });
