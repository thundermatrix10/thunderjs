const uwuStop = [ "https://i.pinimg.com/736x/56/4c/86/564c86edfca94adcd713120dcd630bdb.jpg", "https://cdn.discordapp.com/attachments/1086613044429324309/1106210805411762297/avatars-DiioKOwRdAbVLXTA-LuxClw-t500x500.png", "https://i.redd.it/xa8cqdtatbc41.jpg", "https://i.pinimg.com/originals/6e/c2/a1/6ec2a17d56335388b2f928b3c3976c4a.jpg", "https://cdn.discordapp.com/attachments/1086613044429324309/1106211712274808882/image.png" ];

const susWord = [ "https://cdn.discordapp.com/attachments/1086613044429324309/1194151070964908052/4g4cmw.png?ex=65af4ed9&is=659cd9d9&hm=8e48e7a4e525077d2a1c59616e85dc5bb1fd99b08d612075fab51eb0f5b35221&", "https://us-tuna-sounds-images.voicemod.net/1fba2514-3f00-4787-a049-9a952e645e38-1661841297142.jpeg", "https://i.redd.it/7grrokf5nep71.gif", "https://i.imgflip.com/53mwen.jpg", "https://imgb.ifunny.co/images/6679d1ff64b7242bbb89c99eac487ae1c32c9456e606e731bf17983924aa6cd2_1.jpg", "https://imgb.ifunny.co/images/11f9aeb2f53048db18fb204c5576d4545a5f703e0b50e2a194d6da164966b8e0_1.jpg", "https://i.redd.it/0yizr9n08to51.jpg", "https://ih1.redbubble.net/image.2461709110.1420/flat,750x,075,f-pad,750x1000,f8f8f8.jpg", "https://i.kym-cdn.com/entries/icons/facebook/000/037/614/sussy_baka.jpg" ];

class MessageFormatter { processMessageContent(content) { const msg = String(content).replace('"', "'"); const lmsg = msg.toLowerCase(); const withoutMentionsMsg = lmsg.replace(/<@\d+>/g, "");
    return { msg, lmsg, withoutMentionsMsg };
}

async handleMentions(message, lmsg, withoutMentionsMsg) {
    // Extract mention IDs from the message
    const mentionIDs = lmsg.match(/<@(\d+)>/g)?.map(mention => mention.replace(/<@(\d+)>/g, '$1')) || [];
    if (mentionIDs.length === 0) return;
    
    const unread = global.get("unread") || {};
    const enrolled = global.get("unread_enrollment") || {};
    const unread_users = [];
    
    for (const mention of mentionIDs) {
        const user = global.client.users.cache.get(mention);
        if (!user) {
            console.log('User not found');
            continue;
        }
        
        const member = global.defaultGuild?.members.cache.get(mention);
        if (!member) {
            console.log('User is not a member of this guild');
            continue;
        }
        
        // Check if user is offline and enrolled for notifications
        const status = member.presence?.status || 'offline';
        if (status !== "online" && enrolled[mention]) {
            if (!unread[mention]) {
                unread[mention] = [];
            }
            
            unread[mention].push([
                message.author.id, 
                `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`
            ]);
            
            unread_users.push(mention);
        }
    }
    
    global.set("unread", unread);
    
    // Notify if there are offline users
    if (unread_users.length > 0) {
        await message.channel.send(
            `<@!${message.author.id}> It seems like the users you've mentioned [ ${unread_users} ] are not currently available.\n\nI'll notify them when they return.`
        );
    }
    
    // Debug mentions if enabled
    if (global["debug_mention"] === "true") {
        await message.channel.send(`${mentionIDs.length} mentions: ${mentionIDs}`);
    }
}

isSempCommand(withoutMentionsMsg) {
    return (
        withoutMentionsMsg.includes("semp.js") ||
        withoutMentionsMsg.includes("semp ai") ||
        withoutMentionsMsg.includes("sempgpt") ||
        withoutMentionsMsg.includes("semp ") ||
        withoutMentionsMsg.includes("semp gpt")
    );
}

async handleFunResponses(message, lmsg) {
    // Handle uwu responses
    if (lmsg.includes("uwu")) {
        await global.sendMessage(
            uwuStop[Math.floor(Math.random() * uwuStop.length)], 
            message.channel
        );
    }
    
    // Handle sus patterns
    if (lmsg.match(/s[u]+s/gi)) {
        await global.sendMessage(
            susWord[Math.floor(Math.random() * susWord.length)], 
            message.channel
        );
    }
    
    // Special user handling
    if (message.author.id == 576663196186837003 && lmsg.includes("uwu")) {
        await global.sendMessage("<@576663196186837003>", message.channel);
    }
    
    // Handle hug gif
    if (lmsg.includes("https://tenor.com/view/hug-anime-cute-gif-25588757")) {
        await global.sendMessage(
            `<@${message.author.id}> WANT TO HUG? I WILL HUG YOU! LOOK AT ME, MY EYES https://cdn.discordapp.com/attachments/1086613044429324309/1106219756459147425/image.png`, 
            message.channel
        );
        await message.delete();
    }
}

getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}
}

module.exports = new MessageFormatter();