const { Client, Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const TOKEN = process.env.THREAD_CREATOR_BOT_TOKEN;

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception: ' + err + err.stack?.toString());
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(
        '[FATAL] Possibly Unhandled Rejection at: Promise ',
        promise,
        ' reason: ',
        reason.message
    );
});

const client = new Client({
    allowedMentions: { parse: ['users', 'roles'] },
    intents: 47007
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'move') return;

    const permissions = new PermissionsBitField(interaction.member?.permissions);
    if (!permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        await interaction.reply({
            content: 'You do not have the required permissions to use this command.',
            ephemeral: true
        });
        return;
    }

    await interaction.deferReply();

    const num_messages = interaction.options.getInteger('amount', true);
    const thread_name = interaction.options.getString('thread') || interaction.user.username + "'s thread";
    
    const channel = interaction.channel;
    if (channel.isThread()) return;

    const messages = await channel.messages.fetch({ limit: num_messages, before: interaction.id });
    const thread = await channel.threads.create({
        name: thread_name,
        autoArchiveDuration: 60,
        reason: "Thread created by thread creator bot",
    });
    
    await thread.join();

    const mappedIds = new Collection();

    for (const message of messages.reverse().values()) {
        if (!message.author || message.author.bot) continue;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.member?.displayName || 'Unknown',
                iconURL: message.member?.displayAvatarURL(),
            })
            .setColor(message.member?.displayColor)
            .setDescription(message.content || "*No content*")
            .setFooter({
                text: `Sent at ${message.createdAt.toLocaleString()}`,
            });
        
        if (message.reference) {
            const ref = { ...message.reference };

            if (mappedIds.has(ref.messageId)) {
                ref.channelId = thread.id;
                ref.messageId = mappedIds.get(ref.messageId);
            }

            embed.addFields({
                name: "Replying to",
                value: `[This](https://discord.com/channels/${ref.guildId}/${ref.channelId}/${ref.messageId})`,
            });
        }

        const newMessage = await thread.send({
            embeds: [
                embed.toJSON()
            ]
        });

        mappedIds.set(message.id, newMessage.id);
    }

    await channel.bulkDelete(messages);
    
    await interaction.followUp({
        content: `Moved ${num_messages} messages to thread ${thread_name}`
    });
});

client.login(TOKEN);
