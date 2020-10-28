const logger = require('./util/logger');
const version = require('./package.json').version;

logger.info(`Starting the RSAMusicBot application v${version}`);

//Express
const express = require('express'),
    app = express();

app.use(express.static('public'));


const Discord = require("discord.js"); //baixar a lib
const clientFull = new Discord.Client(); 

try {
  app.listen(process.env.PORT || 3001 || 3002 || 3003, () => {
    console.log('Ambiente logado com sucesso!');
  });
} catch (error) {
  console.error(error);
  console.log('Erro no levantamento do Ambiente do Express!' + error);
  logger.error('Erro no levantamento do Ambiente do Express!' + error);
  logger.debug(err);
  try {
    app.listen(process.env.PORT || 3001 || 3002 || 3003, () => {
      console.log('Ambiente logado com sucesso!');
    });
  } catch (error) {
    console.error(error);
    console.log('Erro, final, no levantamento do Ambiente do Express!' + error);
    logger.error('Erro, final, no levantamento do Ambiente do Express!' + error);
    logger.debug(err);
  }
}

// Load the full build.
var _ = require('lodash');

/**
 * Module Imports
 */
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX } = require("./config.json");

const client = new Client({ disableMentions: "everyone" });



client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Client Events
 */
client.on("ready", () => {
  console.log(`${client.user.username} ready!`);
  console.log(`Bot ${client.user.username} foi iniciado, com ${client.users.size} ` + 
  `usuários, em ${client.channels.size} canais, em ${client.guilds.size} servidores.`); 
  client.user.setActivity(` - Use: ${PREFIX}help`);
});
client.on("warn", (info) => {
    console.log(info);
    logger.error('warn!' + error);
    logger.debug(info);
  });
client.on("error", (err) => {
  console.error(err);
  logger.error('Error!' + err);
  logger.debug(err);
});

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `por favor, espere mais ${timeLeft.toFixed(1)} segundo(s) antes de reutilizar o \`${command.name}\` command.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    logger.error('Error! Ocorreu um erro ao executar esse comando.' + err);
    logger.debug(err);    
    message.reply("Ocorreu um erro ao executar esse comando.").catch(console.error);
  }
});
