import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

export const registerAdminToken = async (directory: string) => {
	const adminToken = randomUUID();
	const now = Date.now();

	return new Promise<string>((resolve, reject) => {
		const command = spawn(
			"npx",
			[
				"wrangler",
				"d1",
				"execute",
				"DB",
				"--remote",
				"--yes",
				"--command",
				`INSERT INTO \`token\` (token, name, scopes, created_at, updated_at) VALUES ('${adminToken}', 'admin-token', '[{"type": "token:read+write", "values": ["*"]}, {"type": "user:read+write", "values": ["*"]}, {"type": "package:read+write", "values": ["*"]}]', ${now}, ${now})`
			],
			{
				cwd: directory
			}
		);

		command.stdout.on("error", (error) => reject(error));

		command.stdout.on("end", () => {
			resolve(adminToken);
		});
	});
};
