const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo pause!`);

module.exports = {
  name: "pause",
  aliases: ["pausa","parada","pr"],
  description: "Pause the currently playing music",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("Não há nada tocando.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    if (queue.playing) {
      queue.playing = false;
      queue.connection.dispatcher.pause(true);
      return queue.textChannel.send(`${message.author} ⏸ pausou a música.`).catch(console.error);
    }
  }
};
