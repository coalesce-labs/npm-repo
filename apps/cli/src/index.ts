import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import degit from "degit";
import inquirer from "inquirer";
import { oraPromise as ora } from "ora";
import { deployWorker } from "./commands/deploy";
import { installDependencies } from "./commands/install";
import { migrate } from "./commands/migrate";
import { registerAdminToken } from "./commands/registerAdminToken";

(async () => {
	const tempDir = join(tmpdir(), "npflared");

	await ora(
		async () => {
			const cloneStream = degit("Thomascogez/npflared/apps/api", { force: true });
			await cloneStream.clone(tempDir);
		},
		{
			failText: "Failed to clone npflared",
			successText: "Cloned npflared successfully",
			text: "Cloning npflared..."
		}
	);

	await ora(
		async () => {
			await installDependencies(tempDir);
		},
		{
			failText: "Failed to install dependencies",
			successText: "Installed dependencies successfully",
			text: "Installing dependencies..."
		}
	);

	const answers = await inquirer.prompt([
		{
			type: "input",
			name: "workerName",
			message: "Worker name",
			default: "npflared"
		},
		{
			type: "input",
			name: "d1DatabaseId",
			required: true,
			message: "Please provide your d1 database id (https://dash.cloudflare.com)"
		},
		{
			type: "input",
			name: "r2BucketName",
			required: true,
			message: "Please provide your r2 bucket name (https://dash.cloudflare.com/workers-and-pages)"
		}
	]);

	await ora(
		async () => {
			const wranglerFileContent = await readFile(join(tempDir, "wrangler.toml"), "utf8");
			await writeFile(
				join(tempDir, "wrangler.toml"),
				wranglerFileContent
					.replaceAll("SERVICE_NAME", answers.workerName)
					.replaceAll("D1_DATABASE_ID", answers.d1DatabaseId)
					.replaceAll("BUCKET_NAME", answers.r2BucketName)
			);
		},
		{
			failText: "Failed to write configuration",
			successText: "Configuration written successfully",
			text: "Writing configuration..."
		}
	);

	await ora(
		async () => {
			await deployWorker(tempDir);
		},
		{
			failText: "Failed to deploy worker",
			successText: "Deployed worker successfully",
			text: "Deploying worker..."
		}
	);

	await ora(
		async () => {
			await migrate(tempDir);
		},
		{
			failText: "Failed to migrate database",
			successText: "Migrated database successfully",
			text: "Migrating database..."
		}
	);

	const adminToken = await ora(
		async () => {
			return await registerAdminToken(tempDir);
		},
		{
			failText: "Failed to register admin token",
			successText: "Registered admin token successfully",
			text: "Registering admin token..."
		}
	);

	console.log(`
🎉 Successfully deployed npflared!

To get started you can read the documentation at https://npflared.cloudflareworkers.com

You can now use the admin token to authenticate yourself:

${adminToken}
`);
})();
