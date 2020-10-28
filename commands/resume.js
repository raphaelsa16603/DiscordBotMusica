const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo resume!`);

module.exports = {
  name: "resume",
  aliases: ["r","retomar","retornar"],
  description: "Retomar a música atual",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("Não há nada tocando.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    if (!queue.playing) {
      queue.playing = true;
      queue.connection.dispatcher.resume();
      return queue.textChannel.send(`${message.author} ▶ retomou a música!`).catch(console.error);
    }

    return message.reply("A fila não está em pausa.").catch(console.error);
  }
};
