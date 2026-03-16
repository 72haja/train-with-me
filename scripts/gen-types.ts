import { existsSync } from "fs";
import { join } from "path";

const envPath = join(import.meta.dir, "../.env.local");

if (existsSync(envPath)) {
    const file = await Bun.file(envPath).text();
    for (const line of file.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length > 0) {
            process.env[key.trim()] = rest.join("=").trim();
        }
    }
}

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
    console.error("SUPABASE_PROJECT_ID is not set in .env.local");
    process.exit(1);
}

const outputPath = join(import.meta.dir, "../packages/apis/supabase/database.types.ts");

console.log(`Generating types for project ${projectId}...`);

const proc = Bun.spawn(
    ["npx", "supabase", "gen", "types", "typescript", "--project-id", projectId],
    { stdout: "pipe", stderr: "inherit" }
);

const output = await new Response(proc.stdout).text();
const exitCode = await proc.exited;

if (exitCode !== 0) {
    console.error("supabase gen types failed");
    process.exit(exitCode);
}

await Bun.write(outputPath, output);
console.log(`Types written to ${outputPath}`);
