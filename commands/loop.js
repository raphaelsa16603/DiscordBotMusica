const { canModifyQueue } = require("../util/EvobotUtil");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo loop!`);

module.exports = {
  name: "loop",
  aliases: ['l',"repetir"],
  description: "Alternar loop de música",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("Não há nada tocando.").catch(console.error);
    if (!canModifyQueue(message.member)) return;

    // toggle from false to true and reverse
    queue.loop = !queue.loop;
    return queue.textChannel
      .send(`Loop é agora ${queue.loop ? "**on**" : "**off**"}`)
      .catch(console.error);
  }
};
