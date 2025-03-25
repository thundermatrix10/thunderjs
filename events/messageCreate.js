const { Events } = require('discord.js');
const axios = require('axios');
const aiHandler = require('../utils/aiHandler');
// const fileManager = require('../utils/fileManager');
const messageFormatter = require('../utils/messageFormatter');
require('dotenv').config();

// Conversation memory store - key: channelId, value: context summary
const conversationMemory = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if ((message.author.id === 1354048588610539591n) || message.bot) return;

        try {
            const { msg, lmsg } = messageFormatter.processMessageContent(message.content);

            if (lmsg === "cat") {
                await message.channel.sendTyping();
                await message.channel.send(await global.generateCat());
                return;
            }

            const withoutMentionsMsg = lmsg.replace(/<@\d+>/g, "");
            if (withoutMentionsMsg !== lmsg) {
                await messageFormatter.handleMentions(message, lmsg, withoutMentionsMsg);
            }

            const contextSummary = conversationMemory.get(message.channelId) || {
                lastMessages: "Start of conversation",
                shouldRespond: false
            };

            contextSummary.lastMessages += `\n${JSON.stringify({
                author: message.author.username,
                content: message.content,
            })}`;

            const responseData = await determineIfResponseNeeded(message, contextSummary);
            contextSummary.shouldRespond = responseData.shouldRespond;
            conversationMemory.set(message.channelId, contextSummary);

            if (responseData.shouldRespond) {
                await message.channel.sendTyping();
                let botResponse = null;

                if (message.attachments.size > 0) {
                    const firstAttachment = message.attachments.first();

                    if (firstAttachment.contentType?.includes('image')) {
                        botResponse = await aiHandler.handleImageWithContext(message, contextSummary.lastMessages);
                    } else {
                        // botResponse = await fileManager.processMediaFile(message, firstAttachment);
                    }
                } else {
                    botResponse = await aiHandler.handleContextualResponse(message, contextSummary.lastMessages);
                }

                if (botResponse) {
                    contextSummary.lastMessages += `\n${JSON.stringify({
                        author: `${client.user.username}(YOU)`,
                        content: botResponse,
                        isBot: true
                    })}`;
                    conversationMemory.set(message.channelId, contextSummary);
                }
            }

            console.log("Conversation memory : ", conversationMemory);
            await messageFormatter.handleFunResponses(message, lmsg);

        } catch (error) {
            console.error("Error in messageCreate handler:", error);
            await message.channel.send(`Error occurred: ${error.message}`);
        }
    },
};

async function determineIfResponseNeeded(message, contextData) {
    try {
        const isBotMentioned = message.content.includes("<@1354048588610539591>") || 
            (message.mentions?.repliedUser?.id === '1354048588610539591');

        const recentHistory = contextData.lastMessages.split("\n").slice(-15).join("\n");

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "mixtral-8x7b-32768",
                messages: [
                    {
                        role: "system",
                        content: `You are a Discord bot named 'thunder.js'. Your job is to:
                        1. Determine if you should respond to the latest message based on context and only IF required and within your conversation

                        Respond whether true or false

                        ALWAYS RESPOND IF:
                        - You (@thunder.js) are directly mentioned or replied to
                        - The message contains \"thunder\", \"ai\", or a question
                        - The message is clearly addressing you or asking for your help`
                    },
                    {
                        role: "user",
                        content: `
                        Recent conversation:
                        ${recentHistory}

                        Latest message from ${message.author.username}: "${message.content}"
                        ${isBotMentioned ? "[THE BOT WAS DIRECTLY MENTIONED]" : ""}

                        Based on this context, determine if you should respond.
                        Do not respond if not needed, or if the message is not relevant to the conversation or your conversation context.
                        Return true or false ONLY`
                    }
                ],
                max_tokens: 100,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.choices[0].message.content.trim().toLowerCase();
        const shouldRespond = result.includes("true");

        console.log(`Checking whether to respond or not : ${shouldRespond}`);

        return {
            shouldRespond: isBotMentioned ? true : shouldRespond
        };

    } catch (error) {
        console.error("Error determining if response is needed:", error);
        return {
            shouldRespond: message.content.includes("<@1354048588610539591>") || 
                (message.mentions?.repliedUser?.id === '1354048588610539591')
        };
    }
}

// const { Events } = require('discord.js');
// const aiHandler = require('../utils/aiHandler');
// // const fileManager = require('../utils/fileManager');
// const messageFormatter = require('../utils/messageFormatter');

// require('dotenv').config();

// // Conversation memory store - key: channelId, value: context summary
// const conversationMemory = new Map();

// // Maximum conversation history to keep per channel
// // const MAX_HISTORY_LENGTH = 20;
// // const MAX_SUMMARY_LENGTH = 1500; // characters

// module.exports = {
//     name: Events.MessageCreate,
//     async execute(message) {
//         // Ignore self and bot messages
//         if ((message.author.id === 1354048588610539591n ) || message.bot) return;

//         try {
//             // Process message content
//             const { msg, lmsg } = messageFormatter.processMessageContent(message.content);
            
//             // Simple cat command - keep this as a non-AI shortcut
//             if (lmsg === "cat") {
//                 await message.channel.sendTyping();
//                 await message.channel.send(await global.generateCat());
//                 return;
//             }
            
//             // Handle mentions - keep offline notification system
//             const withoutMentionsMsg = lmsg.replace(/<@\d+>/g, "");
//             if (withoutMentionsMsg !== lmsg) {
//                 await messageFormatter.handleMentions(message, lmsg, withoutMentionsMsg);
//             }
            
//             // Get or initialize conversation context for this channel
//             const contextSummary = conversationMemory.get(message.channelId) || {
//                 lastMessages: "Start of conversation",
//                 shouldRespond: false
//             };
            
//             // Add current message to history
//             contextSummary.lastMessages += `\n${JSON.stringify({
//                 author: message.author.username,
//                 content: message.content,
//             })}`;
            
//             // Limit history size
//             // if (contextSummary.lastMessages.length > MAX_HISTORY_LENGTH) {
//             //     contextSummary.lastMessages = contextSummary.lastMessages.slice(-MAX_HISTORY_LENGTH);
//             // }
            
//             // Ask AI to decide if a response is needed based on context
//             // and also get updated context summary
//             const responseData = await determineIfResponseNeeded(message, contextSummary);
            
//             // Update conversation memory with new summary and response decision
//             contextSummary.shouldRespond = responseData.shouldRespond;
//             conversationMemory.set(message.channelId, contextSummary);
            
//             // If AI decides to respond, generate and send response
//             if (responseData.shouldRespond) {
//                 await message.channel.sendTyping();
//                 let botResponse = null;

//                 if (message.attachments.size > 0) {
//                     const firstAttachment = message.attachments.first();
                    
//                     if (firstAttachment.contentType?.includes('image')) {
//                         // Handle image with AI context awareness
//                         botResponse = await aiHandler.handleImageWithContext(message, contextSummary.lastMessages);
//                     } else {
//                         // Handle other file attachments
//                         // botResponse = await fileManager.processMediaFile(message, firstAttachment);
//                     }
//                 } else {
//                     // Text-based AI response with contextual awareness
//                     botResponse = await aiHandler.handleContextualResponse(message, contextSummary.lastMessages);
//                 }

//                     // Add bot's response to conversation history
//                 if (botResponse) {
//                     contextSummary.lastMessages += `\n${JSON.stringify({
//                         author: `${client.user.username}(YOU)`,
//                         content: botResponse,
//                         isBot: true
//                     })}`;
                    
//                     // Update in memory
//                     conversationMemory.set(message.channelId, contextSummary);
//                 }
//             }
//             console.log("Conversation memory : " , conversationMemory);

//             // Keep fun Easter egg responses regardless of AI decision
//             await messageFormatter.handleFunResponses(message, lmsg);
            
//         } catch(error) {
//             console.error("Error in messageCreate handler:", error);
//             await message.channel.send(`Error occurred: ${error.message}`);
//         }
        
//         // Debug logging if enabled
//         if (global.debug_message === "true") {
//             // console.log(message);
//         }
//     },
// };

// // Function to ask OpenAI if a response is needed and to update the context summary
// async function determineIfResponseNeeded(message, contextData) {
//     try {
//         const isBotMentioned = message.content.includes("<@1354048588610539591>") || 
//             (message.mentions?.repliedUser?.id === '1354048588610539591');
        
//         // Format recent conversation history by last 15 messages as lastMessages is a string.
//         const recentHistory = contextData.lastMessages.split("\n").slice(-15).join("\n");
            
//         // Ask OpenAI to decide if response is needed and update summary
//         const response = await global.openai.chat.completions.create({
//             model: "mistralai/mistral-7b-instruct",
//             max_completion_tokens: 100,
//             messages: [
//                 { 
//                     role: "system", 
//                     content: `You are a Discord bot named 'thunder.js'. Your job is to:
//                     1. Determine if you should respond to the latest message based on context and only IF required and within your conversation
                    
//                     Respond whether true or false
                    
//                     ALWAYS RESPOND IF:
//                     - You (@thunder.js) are directly mentioned or replied to
//                     - The message contains "thunder", "ai", or a question
//                     - The message is clearly addressing you or asking for your help` 
//                 },
//                 { 
//                     role: "user", 
//                     content: `
//                     Recent conversation:
//                     ${recentHistory}
                    
//                     Latest message from ${message.author.username}: "${message.content}"
//                     ${isBotMentioned ? "[THE BOT WAS DIRECTLY MENTIONED]" : ""}
                    
//                     Based on this context, determine if you should respond.
//                     Do not respond if not needed, or if the message is not relevant to the conversation or your conversation context.
//                     Return true or false ONLY` 
//                 }
//             ],
//         });
        
//         const result = response.choices[0].message.content.trim();
//         // Removing the think tag and ```json``` code block
//         const resultText = `{
//             "shouldRespond": ${result}
//         }`
//         let resultData;
        
//         try {
//             resultData = JSON.parse(resultText);
//             console.log(`Checking whether to respond or not : ${resultText}`);
//         } catch (e) {
//             console.error("Error parsing AI response as JSON:", e);
//             console.log(`Data : ${resultText}`);
// 	    // Fallback to default behavior if JSON parsing fails
//             resultData = {
//                 shouldRespond: isBotMentioned,
//             };
//         }
        
//         // Always respond if directly mentioned, regardless of AI decision
//         if (isBotMentioned) {
//             resultData.shouldRespond = true;
//         }
        
//         return resultData;
        
//     } catch (error) {
//         console.error("Error determining if response is needed:", error);
//         // Fallback to basic logic if AI fails
//         return {
//             shouldRespond: message.content.includes("<@1354048588610539591>") || 
//                 (message.mentions?.repliedUser?.id === '1354048588610539591'),
//             updatedSummary: contextData.summary
//         };
//     }
// }
