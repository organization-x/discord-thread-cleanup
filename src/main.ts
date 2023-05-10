import { dirname as dir, importx } from "@discordx/importer";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import "reflect-metadata";

export const bot = new Client({
	// Discord intents
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMessageReactions,
		IntentsBitField.Flags.GuildVoiceStates,
		IntentsBitField.Flags.MessageContent
	],

	// Debug logs are disabled in silent mode
	silent: false
});

bot.once("ready", async () => {
	await bot.guilds.fetch();

	await bot.initApplicationCommands();

	console.log("Bot started");
});

bot.on("interactionCreate", async interaction => {
	bot.executeInteraction(interaction);
});

bot.on("messageCreate", async message => {
	await bot.executeCommand(message);
});

bot.on("unhandledRejection", (reason: Error, promise: Promise<unknown>) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

bot.on("uncaughtException", (error: Error) => {
	console.error("Uncaught Exception at:", error);
});

async function run() {
	await importx(
		dir(import.meta.url) + "/{events/discord,commands}/**/*.{ts,js}"
	);

	await bot.login(process.env.DISCORD_THREAD_CREATOR_TOKEN!);
}

run();
