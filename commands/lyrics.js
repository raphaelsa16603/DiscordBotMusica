const { MessageEmbed } = require("discord.js");
const lyricsFinder = require("lyrics-finder");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo lyrics!`);

module.exports = {
  name: "lyrics",
  aliases: ["ly","letra"],
  description: "Obtenha a letra da música que está tocando",
  async execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.channel.send("Não há nada tocando.").catch(console.error);

    let lyrics = null;

    try {
      lyrics = await lyricsFinder(queue.songs[0].title, "");
      if (!lyrics) lyrics = `Nenhuma letra encontrada para ${queue.songs[0].title}.`;
    } catch (error) {
      lyrics = `Nenhuma letra encontrada para ${queue.songs[0].title}.`;
    }

    let lyricsEmbed = new MessageEmbed()
      .setTitle("Lyrics")
      .setDescription(lyrics)
      .setColor("#F8AA2A")
      .setTimestamp();

    if (lyricsEmbed.description.length >= 2048)
      lyricsEmbed.description = `${lyricsEmbed.description.substr(0, 2045)}...`;
    return message.channel.send(lyricsEmbed).catch(console.error);
  }
};
