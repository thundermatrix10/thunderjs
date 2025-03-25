const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDescription('get notified when someone pings you')
        .addBooleanOption(option =>
            option.setName('opt')
            .setDescription('Set true for opt-in and false for opt-out')
            .setRequired(true)
        ),
    async execute(interaction) {
        // Get the status from the interaction's options
        const opt = interaction.options.getBoolean('opt');
        const unread_enrollment = global.get("unread_enrollment");
        try {

            unread_enrollment[interaction.member.id] = opt == true ? true : null;
            global.set("unread_enrollment", unread_enrollment);

            await interaction.editReply("Successfully changed the status to " + opt);
        } catch (error) {
            // Handle any errors
            console.error(error);
            await interaction.editReply("FAILED | " + error);
        }
    },
};