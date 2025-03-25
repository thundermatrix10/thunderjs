const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clean')
        .setDescription('Deletes the message and default is to delete 50 messages from anyone in prompted channel.')
        .addIntegerOption(option =>
            option.setName('message_count')
            .setDescription('Number of messages to delete')
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('regex')
            .setDescription('Any pattern to match for deletion')
            .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user')
            .setDescription('User to delete messages from')
        )
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('Channel to delete messages from')
        )
        .addRoleOption(option =>
            option.setName('role')
            .setDescription('Role to delete messages from'))
        .addBooleanOption(option =>
            option.setName('links_attachments_only')
            .setDescription('To delete attachment messages only')
        ),
    async execute(interaction) {
        const messageCount = interaction.options.getInteger('message_count') || 50;
        const regex = interaction.options.getString('regex') || '';
        const user = interaction.options.getUser('user');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const role = interaction.options.getRole('role');
        const linksAttachmentsOnly = interaction.options.getBoolean('links_attachments_only');

        let messagesToDelete = await channel.messages.fetch({ limit: 100 });

        let deleteCount = 0;
        messagesToDelete = messagesToDelete.filter(message => {
            if (deleteCount >= messageCount || message.id == interaction.id) return false;

            // Regex pattern matching trap
            const pattern = new RegExp(regex);
            if (!pattern.test(message.content) && regex != '') return false;

            // User mataching trap
            if (user && message.author.id !== user.id) return false;

            // Channel mataching trap
            if (channel && message.channel.id !== channel.id) return false;

            // Role mataching trap
            if (role && !message.member.roles.cache.has(role.id)) return false;

            if (linksAttachmentsOnly && !(message.attachments.length > 0 || message.content.includes("http"))) return false;
            deleteCount++;
            return true;
        });

        console.log("================================================");
        console.log(`Deleted ${deleteCount} messages`);
        console.log("================================================");
        // Delete the messages.
        if (messagesToDelete.size === 0) {
            await interaction.editReply('No messages found to delete.');
        } else {
            try {
                await channel.bulkDelete(messagesToDelete);
                await interaction.editReply(`Deleted ${messagesToDelete.size} messages.`);
            } catch (error) {
                console.error(error);
                await interaction.editReply('An error occurred while trying to delete messages.');
            }
        }

    },
};