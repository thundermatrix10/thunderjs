const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shell')
        .setDescription('developer only command execution')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('script')
            .setDescription('The code ran directly into linux bash shell')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.editReply("Executing the script...");

        // Get the code from the interaction's options
        const code = interaction.options.getString('script');

        // for print out thing within channel lol.
        const print = interaction.channel.send;
        try {
            // Run the given "code" into shell of system
            const { exec } = require('child_process');
            const result = exec(code, (error, stdout, stderr) => {
                if (error) {
                    interaction.editReply(`execution error : \`${error}\``);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
            });

            await interaction.editReply(result);

        } catch (error) {
            // Handle any errors
            console.error(error);

            // Display the error by editReply
            await interaction.editReply(`Error while executing the script : \`${error}\``);
        }
    },
};