const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bing')
        .setDescription('Bot will use Bing AI.')
        .addStringOption(option => option
            .setName("prompt")
            .setDescription("Prompt to chat with")
            .setRequired(true)),
    async execute(interaction) {
        let msg = await global.bingApi.sendMessage(interaction.options.getString("prompt"), global.bingContext)
        console.log(msg.toString())
        await interaction.editReply("BING : " + msg.text);
    },
};