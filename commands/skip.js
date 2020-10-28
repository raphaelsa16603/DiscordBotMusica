const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo skip!`);


module.exports = {
  name: "skip",
  aliases: ["s","pular"],
  description: "Pular a música que está tocando",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue)
      return message.reply("Não há nada reproduzindo que eu pudesse pular para você.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    queue.playing = true;
    queue.connection.dispatcher.end();
    queue.textChannel.send(`${message.author} ⏭ pulou a música`).catch(console.error);
  }
};
