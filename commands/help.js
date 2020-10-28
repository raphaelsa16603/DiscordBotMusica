const { MessageEmbed } = require("discord.js");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo help!`);

module.exports = {
  name: "help",
  aliases: ["h","ajuda","man"],
  description: "Exibir todos os comandos e descrições",
  execute(message) {
    let commands = message.client.commands.array();

    let helpEmbed = new MessageEmbed()
      .setTitle("RSAMusicBot Ajuda")
      .setDescription("Lista de todos os comandos")
      .setColor("#F8AA2A");

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `**${message.client.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
        `${cmd.description}`,
        true
      );
    });

    helpEmbed.setTimestamp();

    return message.channel.send(helpEmbed).catch(console.error);
  }
};
