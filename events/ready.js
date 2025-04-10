const { Events } = require('discord.js');
const guildId = '757611583919751178';
const channelId = '757611583919751181';

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`Unable to find guild with ID ${guildId}`);
            return;
        }
        global.defaultGuild = guild;
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            console.error(`Unable to find channel with ID ${channelId}`);
            return;
        }

        global["defaultChannel"] = channel;

        if (global.get("error") != null) {
            await channel.send("thunderjs here, an error occured in the previous session. ```" + JSON.stringify(global.get("error")) + "```");
            global.set("error", null);
        }
    },
};
