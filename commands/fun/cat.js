const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Generates random cat image'),
    async execute(interaction) {
        await wait(1000);
        await interaction.editReply(await global.generateCat());
    },
};