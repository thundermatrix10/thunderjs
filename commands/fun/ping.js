const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! Maybe?'),
    async execute(interaction) {
        await wait(1000);
        await interaction.editReply(`hi y'all`);
    },
};