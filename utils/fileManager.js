const https = require('https');
const fs = require('fs');
const wait = require('node:timers/promises').setTimeout;

class FileManager {
    constructor() {
        this.tempDir = "/backup/semp/temp/";
        this.maxWaitTime = 60000; // 60 seconds max wait for processing
    }
    
    async downloadFile(url, filename) {
        const filePath = this.tempDir + filename;
        
        try {
            await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Failed to download file: ${res.statusCode}`));
                        return;
                    }
                    
                    const fileStream = fs.createWriteStream(filePath);
                    res.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve();
                    });
                    
                    fileStream.on('error', (err) => {
                        reject(err);
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            });
            
            console.log(`File downloaded successfully to ${filePath}`);
            return filePath;
        } catch (error) {
            console.error(`Error downloading file: ${error}`);
            throw error;
        }
    }
    
    async processMediaFile(message, attachment) {
        const sent_msg = await message.channel.send("Downloading the file...");
        
        try {
            // Download the file
            const filePath = await this.downloadFile(attachment.url, attachment.name);
            await sent_msg.edit("Inferring the media content...");
            
            // Upload to Google AI
            const fileResult = await global.fileManager.uploadFile(filePath, {
                mimeType: attachment.contentType,
                name: attachment.id,
                displayName: attachment.id,
            });
            
            // Wait for processing to complete
            const startTime = Date.now();
            let state;
            
            do {
                await wait(1000);
                state = await global.fileManager.getFile("files/" + attachment.id);
                
                if (Date.now() - startTime > this.maxWaitTime) {
                    throw new Error("File processing timed out");
                }
            } while (state.state === 'PROCESSING');
            
            await sent_msg.edit("I am analyzing the content...");
            
            // Generate content with Gemini Vision
            const result = await global.geminivision.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: message.content },
                            {
                                fileData: {
                                    mimeType: fileResult.file.mimeType,
                                    fileUri: fileResult.file.uri
                                }
                            },
                        ],
                    },
                ],
            });
            
            const response = result.response;
            const text = response.text();
            
            await sent_msg.edit(text);
            return sent_msg;
        } catch (error) {
            console.error("Error processing media file:", error);
            await sent_msg.edit("Sorry, I encountered an error processing the file.");
            return sent_msg;
        }
    }
}

module.exports = new FileManager();