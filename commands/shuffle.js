const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo shuffle!`);

module.exports = {
  name: "shuffle",
  aliases: ["aleatório","embaralhar"],
  description: "Deixa a fila aleatória",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send("Não há fila.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    let songs = queue.songs;
    for (let i = songs.length - 1; i > 1; i--) {
      let j = 1 + Math.floor(Math.random() * i);
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    queue.songs = songs;
    message.client.queue.set(message.guild.id, queue);
    queue.textChannel.send(`${message.author} 🔀 embaralhou a fila`).catch(console.error);
  }
};
