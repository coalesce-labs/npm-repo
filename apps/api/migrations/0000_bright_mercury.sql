CREATE TABLE `package_release` (
	`package` text NOT NULL,
	`version` text NOT NULL,
	`tag` text NOT NULL,
	`manifest` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`package`, `version`),
	FOREIGN KEY (`package`) REFERENCES `package`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `package` (
	`name` text PRIMARY KEY NOT NULL,
	`dist_tags` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `token` (
	`token` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scopes` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
