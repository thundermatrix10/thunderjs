const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Bot will refresh'),
    async execute(interaction) {
        await interaction.editReply("Executing git pull request");
        exec('rm db.json && git pull', async(error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                await interaction.editReply(`Error occurred. \n ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            await interaction.editReply(stdout);
        });
    },
};