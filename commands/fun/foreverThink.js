const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('foreverthink')
        .setDescription('Bot will think forever.'),
    async execute(interaction) {
        console.log("thinking...");
    },
};