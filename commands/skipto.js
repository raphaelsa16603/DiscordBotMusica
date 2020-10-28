const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo skipto!`);

module.exports = {
  name: "skipto",
  aliases: ["st","pulepara"],
  description: "Pule para o número da fila selecionado",
  execute(message, args) {
    if (!args.length)
      return message
        .reply(`Uso: ${message.client.prefix}${module.exports.name} <Número da música na fila>`)
        .catch(console.error);

    if (isNaN(args[0]))
      return message
        .reply(`Uso: ${message.client.prefix}${module.exports.name} <Número da música na fila>`)
        .catch(console.error);

    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send("Não há fila.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    if (args[0] > queue.songs.length)
      return message.reply(`A fila é só de ${queue.songs.length} musicas!`).catch(console.error);

    queue.playing = true;
    if (queue.loop) {
      for (let i = 0; i < args[0] - 2; i++) {
        queue.songs.push(queue.songs.shift());
      }
    } else {
      queue.songs = queue.songs.slice(args[0] - 2);
    }
    queue.connection.dispatcher.end();
    queue.textChannel.send(`${message.author} ⏭ pulado para a musica ${args[0] - 1}`).catch(console.error);
  }
};
