import { spawn } from "node:child_process";
export const deployWorker = async (directory: string) => {
	return new Promise<void>((resolve, reject) => {
		const command = spawn("npx", ["wrangler", "deploy", "--yes"], { cwd: directory });

		command.stdout.on("error", (error) => reject(error));

		command.stdout.on("end", () => {
			resolve();
		});
	});
};
