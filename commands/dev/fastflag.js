const fs = require('fs');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fflag')
        .setDescription('fast flag for global function control')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('name')
            .setDescription('the fast flag name')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('value')
            .setDescription('the value for the given fast flag')
            .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.editReply("Running the code...");

        // Get the code from the interaction's options
        const name = interaction.options.getString('name');
        const value = interaction.options.getString('value');

        if (value != null) {
            try {
                // Update fastFlags.json with the new value
                const oldValue = global.setFFlag(name, value);
                global[name] = value; // Update the global value.
                await interaction.editReply("Changed the fast flag value | [ `" + name + "` ] " + oldValue + " >> " + value);
            } catch (error) {
                // Handle any errors
                console.log("FF Operation Error: " + error);
                await interaction.editReply("Failed to execute the operation | " + error);
            }
        } else {
            try {
                // Fetch the fast flag value from fastFlag.json
                const value = global.getFFlag(name);
                global[name] = value; // Update manually in case something went wrong
                await interaction.editReply("The fast flag value  [ `" + name + "` ] >> " + value);
            } catch (error) {
                // Handle any errors
                console.log("FF Operation Error: " + error);
                await interaction.editReply("Failed to execute the operation | " + error);
            }
        }
    },
};