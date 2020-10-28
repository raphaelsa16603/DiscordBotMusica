const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo remove!`);

module.exports = {
  name: "remove",
  aliases: ["remover","retirar"],
  description: "Remover música da fila",
  execute(message, args) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send("Não há fila.").catch(console.error);
    if (!canModifyQueue(message.member)) return;
    
    if (!args.length) return message.reply(`Uso: ${message.client.prefix}remove <Número da música na Fila>`);
    if (isNaN(args[0])) return message.reply(`Uso: ${message.client.prefix}remove <Número da música na Fila>`);

    const song = queue.songs.splice(args[0] - 1, 1);
    queue.textChannel.send(`${message.author} ❌ removeu **${song[0].title}** da Fila.`);
  }
};
