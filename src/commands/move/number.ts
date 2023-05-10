import {
	ApplicationCommandOptionType,
	Collection,
	CommandInteraction,
	EmbedBuilder
} from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup({ name: "move", description: "Move commands" })
@SlashGroup("move")
export class MoveAmount {
	@Slash({
		name: "amount",
		description:
			"Move last x messages to a thread the delete the original ones."
	})
	async setRepo(
		@SlashOption({
			name: "amount",
			description: "Last x messages to move.",
			type: ApplicationCommandOptionType.Integer,
			required: true
		})
		num_messages: string,
		@SlashOption({
			name: "thread-name",
			description: "Name of the thread",
			type: ApplicationCommandOptionType.String,
			required: false
		})
		thread_name: string | undefined,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({ ephemeral: true });

		thread_name = thread_name || interaction.user.username + "'s thread";

		const channel = interaction.channel;

		if (
			!channel ||
			!channel.isTextBased() ||
			channel.isDMBased() ||
			channel.isThread() ||
			channel.isVoiceBased()
		) {
			await interaction.followUp({
				content: `Cannot move messages in this channel.`,
				ephemeral: true
			});
			return;
		}

		const messages = await channel.messages.fetch({
			limit: Number(num_messages),
			before: interaction.id
		});
		const thread = await channel.threads.create({
			name: thread_name,
			autoArchiveDuration: 60,
			reason: "Thread created by thread creator bot"
		});

		await thread.join();

		const mappedIds = new Collection<string | undefined, string | undefined>();

		for (const message of messages.reverse().values()) {
			if (!message.author) continue;
			if (message.thread) {
				messages.delete(message.id);
				continue;
			}
			if (message.attachments && message.attachments.size > 0) {
				for (const attachment of message.attachments.values()) {
					if (attachment.size > 8388608) {
						const newMessage = await thread.send({
							content: `<@${message.member?.id}> sent: ${message.content}`
						});
						mappedIds.set(message.id, newMessage.id);
					}
					const newMessage = await thread.send({
						content: `<@${message.member?.id}> sent: ${message.content}`,
						files: [attachment.url]
					});
					mappedIds.set(message.id, newMessage.id);
				}
				continue;
			}

			const embed = new EmbedBuilder()
				.setAuthor({
					name: message.member?.displayName || "Unknown",
					iconURL: message.member?.displayAvatarURL()
				})
				.setColor(message.member?.displayColor || "White")
				.setDescription(message.content || "*No content*")
				.setFooter({
					text: `Sent at ${message.createdAt.toLocaleString()}`
				});

			if (message.reference) {
				const ref = { ...message.reference };

				if (mappedIds.has(ref.messageId)) {
					ref.channelId = thread.id;
					ref.messageId = mappedIds.get(ref.messageId);
				}

				embed.addFields({
					name: "Replying to",
					value: `[This](https://discord.com/channels/${ref.guildId}/${ref.channelId}/${ref.messageId})`
				});
			}

			const newMessage = await thread.send({
				embeds: [embed.toJSON()]
			});

			mappedIds.set(message.id, newMessage.id);
		}

		await channel.bulkDelete(messages);

		await interaction.followUp({
			content: `Moved ${messages.size} messages to thread ${thread_name}`,
			ephemeral: true
		});
	}
}
