// require('dotenv').config();
// const { Client, GatewayIntentBits } = require('discord.js');

// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//   ]
// });

// client.once('ready', () => {
//   console.log(`Logged in as ${client.user.tag}`);
// });

// // Example event
// client.on('messageCreate', message => {
//   if (message.content === '!ping') {
//     message.reply('Pong!');
//   }
// });

// client.login(process.env.TOKEN);

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai');
// const { GoogleAIFileManager } = require('@google/generative-ai/files');
// const keep_alive = require('./keep_alive.js');

// Setup Discord client with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Load commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] Missing "data" or "execute" in ${file}`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const fastFlagsFile = 'fastFlags.json';

// Ensure fastFlags.json exists
if (!fs.existsSync(fastFlagsFile)) {
    fs.writeFileSync(fastFlagsFile, JSON.stringify({}, null, 4));
    console.log("Created fastFlags.json");
}

// Load Fast Flags
const fFlagData = JSON.parse(fs.readFileSync('fastFlags.json'));
for (const key in fFlagData) {
  if (fFlagData.hasOwnProperty(key)) {
    global[key] = fFlagData[key];
  }
}

// Google AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", safetySettings });

global.gemini = model;
global.geminivision = model;
// global.fileManager = fileManager;
global.client = client;

// OpenAI setup
import("openai").then(openai => {
  global.openai = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    dangerouslyAllowBrowser: true
  });
  console.log("Connected to OpenAI");
}).catch(console.error);

// Global helper functions
global.sendMessage = async (msg, channel) => {
  const chunkSize = 1900;
  const chunks = msg.match(new RegExp(`.{1,${chunkSize}}`, 'g'));
  for (const chunk of chunks) {
    await (channel || global.defaultChannel).send(chunk);
  }
};

global.getFFlag = name => JSON.parse(fs.readFileSync('fastFlags.json'))[name];
global.setFFlag = (name, value) => {
  const file = 'fastFlags.json';
  const flags = JSON.parse(fs.readFileSync(file));
  const oldValue = flags[name] || "NULL";
  flags[name] = value;
  fs.writeFileSync(file, JSON.stringify(flags, null, 4));
  return oldValue;
};

const tempFile = 'temp.json';

// Auto-create temp.json if it doesn't exist
if (!fs.existsSync(tempFile)) {
    fs.writeFileSync(tempFile, JSON.stringify({}, null, 4));
    console.log("Created temp.json");
}

global.get = name => JSON.parse(fs.readFileSync('temp.json'))[name];
global.set = (name, value) => {
  const file = 'temp.json';
  const data = JSON.parse(fs.readFileSync(file));
  const oldValue = data[name] || "NULL";
  data[name] = value;
  fs.writeFileSync(file, JSON.stringify(data, null, 4));
  return oldValue;
};

global.generateCat = async () => {
  try {
    const response = await fetch('https://api.thecatapi.com/v1/images/search?mime_types=gif', {
      headers: { 'x-api-key': process.env.CAT_API_KEY }
    });
    const data = await response.json();
    return data[0].url;
  } catch (err) {
    return 'Error fetching cat image.';
  }
};

// Error handling
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  global.set("error", JSON.stringify(err));
});

// Startup
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.login(process.env.DISCORD_TOKEN);
