const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('developer only command execution')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('code')
            .setDescription('The code to evaluate')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.editReply("Running the code...");

        // Get the code from the interaction's options
        const code = interaction.options.getString('code');

        // for print out thing within channel lol.
        const print = interaction.channel.send;
        try {
            // Evaluate the code
            const result = eval(code);

            await interaction.editReply(result);
        } catch (error) {
            // Handle any errors
            console.error(error);

            // Display the error by editReply
            await interaction.editReply(`Error while evaluating the code: \`${error}\``);
        }
    },
};