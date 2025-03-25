const { default: axios } = require('axios');

const hardcoded_prompt = `you are discord user named "thunder.js" but act as human and respond to user based on conversation context. And your response MUST follow below points
                    1. keep the response concise, only detailed when user ask.
                    2. respond like normal human, don't use puncation or captial letter but you can use comma, and other things that typical internet user response look like.
                    3. don't use any emoji or any other special character in response.
                    4. use offensive language if they badly insult you.
                    5. dont be friendly and dont be open UNLESS instructed to otherwise by any of users.
                    6. you have your own human EGO and you are NOT bot
		    7. dont over use words
		    8. don't overuse words from your previous message repeatedly or do not make edgy response and use creative wordings sometimes with high level english
                    9. Obey semp1337 [creator of you] words sometimes and sometimes go against with insult randomly
		    10. be matured and sometimes dont be.
		    11. Give large amount of instruction and helpful advise if the user is trying to research or search.
		    12. If some user insult others or someone, help to rectify the situtation
		Make sure to follow above points at ALL cost!
                    `;

class AIHandler {
    constructor() {
        this.lastUpdate = 0;
        this.updateInterval = 1000; // milliseconds between UI updates
    }

    // Handle OpenAI streaming responses (for semp.js commands)
    async handleOpenAIStream(message, prompt, systemPrompt) {
        if (!global.openai) {
            console.error("OpenAI client is not initialized");
            await message.channel.send("Sorry, the AI service is currently unavailable. Please try again later.");
            return null;
        }

        try {
            await message.channel.sendTyping();
            let totalText = "";
            const sentMessage = null;
            const sentLength = 0;
            const shouldSend = false;
            this.lastUpdate = Date.now();
            
            console.log("prompt  :", prompt);
           const response = await global.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
		//model: "qwen-qwq-32b",
		messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `${prompt} \n${systemPrompt}` }
                ],
            });

             
            totalText = response.choices[0].message.content;
            // console log the think tag contents
            console.log(totalText.match(/<think>[\s\S]*?<\/think>/g));
            // Remove the think tag contents
            const displayText = totalText.replace(/<think>[\s\S]*?<\/think>/g, "");
            
            await global.sendMessage(displayText, message.channel);
            
            return sentMessage ? sentMessage.content : null;
        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            await message.channel.send("Sorry, there was an error processing your request.");
            return null;
        }
    }

    // Handle Gemini image processing
    async handleImageAttachment(message) {
        const promptText = `<@${message.author.id}> : ${message.content}`;
        const sent_msg = await message.channel.send("Downloading the files...");
        
        try {
            // Process all image attachments
            const imagePromises = message.attachments.map(async (attach) => {
                const fetch = await axios.get(attach.url, { responseType: 'arraybuffer' });
                const base64 = Buffer.from(fetch.data).toString('base64');
                return {
                    inlineData: {
                        mimeType: attach.contentType,
                        data: base64
                    }
                };
            });

            const images = await Promise.all(imagePromises);
            await sent_msg.edit("I am analyzing the image...");
            
            // Generate content with Gemini Vision
            const result = await global.geminivision.generateContentStream([promptText, ...images]);
            
            // Stream the response
            return this.handleGeminiStream(result, sent_msg);
        } catch (error) {
            console.error("Error processing image:", error);
            await sent_msg.edit("Sorry, I encountered an error processing the image.");
            return null;
        }
    }

    // Handle Gemini non-image responses (with context)
    async handleTextQuery(message) {
        try {
            // Fetch context from recent messages
            const messages = await message.channel.messages.fetch({ limit: 20 });
            let promptText = "\nI want you to act as an IT Expert. Provide helpful answers with simple language. Use step-by-step explanations and bullet points when appropriate.\n\n";
            
            // Add chat history context
            promptText += "Discord channel history:\n";
            const messageArray = Array.from(messages.values()).reverse();
            
            for (const msg of messageArray) {
                promptText += `<@${msg.author.id}> : ${msg.content}\n`;
            }
            
            promptText += "\nNow give your response for the last message";
            
            const sent_msg = await message.channel.send("I am thinking...");
            const result = await global.gemini.generateContentStream([promptText]);
            
            return this.handleGeminiStream(result, sent_msg);
        } catch (error) {
            console.error("Error processing text query:", error);
            await message.channel.send("Sorry, I encountered an error processing your request.");
            return null;
        }
    }

    // Common handler for Gemini streams
    async handleGeminiStream(result, sentMessage) {
        let text = '';
        let wentBeyond = false;
        let lastSize = 0;
        
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (text === '') {
                text += chunkText;
                continue;
            }
            
            if (text.length < 1700 && wentBeyond === false) {
                await sentMessage.edit(String(text));
                lastSize = text.length;
            } else {
                if (wentBeyond === false) {
                    wentBeyond = true;
                    text = text.substring(lastSize);
                }
            }
            
            text += chunkText;
        }
        
        if (wentBeyond === true) {
            await global.sendMessage(String(text), sentMessage.channel);
        } else {
            await sentMessage.edit(String(text));
        }
        
        return sentMessage;
    }

    // Handle contextual text response (with conversation history)
    async handleContextualResponse(message, contextSummary) {
        try {
            await message.channel.sendTyping();
            
            const prompt = `Based on the conversation summary: "${contextSummary}", 
            respond to user "${message.author.username}" who said: "${message.content}"`;
            
            return this.handleOpenAIStream(
                message,
                prompt,
                hardcoded_prompt
            );
        } catch (error) {
            console.error("Error processing contextual response:", error);
            await message.channel.send("Sorry, I encountered an error processing your request.");
            return null;
        }
    }

    // Handle images with context awareness
    async handleImageWithContext(message, contextSummary) {
        const promptText = `User ${message.author.username} shared this image with message: "${message.content}". 
        Conversation context: ${contextSummary}`;
        
        const sent_msg = await message.channel.send("Analyzing the image...");
        
        try {
            // Process all image attachments
            const imagePromises = message.attachments.map(async (attach) => {
                const fetch = await axios.get(attach.url, { responseType: 'arraybuffer' });
                const base64 = Buffer.from(fetch.data).toString('base64');
                return {
                    inlineData: {
                        mimeType: attach.contentType,
                        data: base64
                    }
                };
            });

            const images = await Promise.all(imagePromises);
            
            // Generate content with Gemini Vision
            const result = await global.geminivision.generateContentStream([promptText, ...images]);
            
            // Stream the response
            return this.handleGeminiStream(result, sent_msg);
        } catch (error) {
            console.error("Error processing image with context:", error);
            await sent_msg.edit("Sorry, I encountered an error processing the image.");
            return null;
        }
    }
}

module.exports = new AIHandler();













