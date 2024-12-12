import { spawn } from "node:child_process";
export const installDependencies = async (directory: string) => {
	return new Promise((resolve, reject) => {
		const command = spawn("npm", ["install", "--omit=dev"], { cwd: directory });

		const chunks: string[] = [];

		command.stdout.on("data", (chunk) => {
			chunks.push(String(chunk));
		});

		command.stdout.on("error", (error) => reject(error));

		command.stdout.on("end", () => {
			const reconciledStdout = chunks.join("");

			resolve(reconciledStdout);
		});
	});
};
