const { REST } = require('@discordjs/rest');
const { SlashCommandBuilder, Routes } = require('discord.js');

const commandData = new SlashCommandBuilder()
	.setName('move')
	.setDescription('Move x messages to a thread and delete the original messages')
	.addIntegerOption(option => option.setName('amount').setDescription('The amount of messages to move').setRequired(true))
	.addStringOption(option => option.setName('thread').setDescription('The name of the thread to create'));

const rest = new REST({ version: '10' }).setToken(process.env.THREAD_CREATOR_BOT_TOKEN);

rest.put(
	Routes.applicationCommands('981255217351905370'),
	{ body: [commandData.toJSON()] },
).then(() => console.log('Successfully registered application commands.')).catch(console.error);
