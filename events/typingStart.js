// const { Events } = require('discord.js');

// module.exports = {
//     name: Events.TypingStart,
//     async execute(typing) {
//         let unread = global.get("unread");
//         if (unread[typing.user.id] != null) {
//             let unreadMessages = `Hey <@!${typing.user.id}>! While you were offline, these user[s] have mentioned you, \n\n`;

//             for (let msg in unread[typing.user.id]) {
//                 msg = unread[typing.user.id][msg];
//                 unreadMessages += `<@!${msg[0]}> | ${msg[1]}\n`
//             }

//             unread[typing.user.id] = null;
//             await typing.channel.send(unreadMessages);
//             global.set("unread", unread);
//         }
//         //console.log(typing.channel.send(`<@!${typing.user.id}>, are you typing?`));
//     },
// };

const { Events } = require('discord.js');

module.exports = {
    name: Events.TypingStart,
    async execute(typing) {
        let unread = global.get("unread") || {};  // Ensure `unread` is always an object

        if (unread[typing.user.id] && unread[typing.user.id].length > 0) {
            let unreadMessages = `Hey <@!${typing.user.id}>! While you were offline, these user[s] mentioned you:\n\n`;

            for (let msg of unread[typing.user.id]) {
                unreadMessages += `<@!${msg[0]}> | ${msg[1]}\n`;
            }

            unread[typing.user.id] = [];  // Clear unread messages after sending
            await typing.channel.send(unreadMessages);
            global.set("unread", unread);
        }
    },
};
