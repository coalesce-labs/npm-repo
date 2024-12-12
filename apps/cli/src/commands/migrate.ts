import { spawn } from "node:child_process";
export const migrate = async (directory: string) => {
	return new Promise<void>((resolve, reject) => {
		const command = spawn("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--remote", "--yes"], {
			cwd: directory
		});

		command.stdout.on("error", (error) => reject(error));

		command.stdout.on("end", () => {
			resolve();
		});
	});
};
