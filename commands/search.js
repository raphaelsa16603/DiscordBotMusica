const { MessageEmbed } = require("discord.js");
const { YOUTUBE_API_KEY } = require("../config.json");
const YouTubeAPI = require("simple-youtube-api");
// Load the full build.
var __ = require('lodash');
var debounced_youtube = __.debounce(YouTubeAPI, 200);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo search!`);

module.exports = {
  name: "search",
  aliases: ["pes","pesquise","pesquisar"],
  description: "Pesquise e selecione vídeos para reproduzir",
  async execute(message, args) {
    if (!args.length)
      return message.reply(`Uso: ${message.client.prefix}${module.exports.name} <Video Name>`).catch(console.error);
    if (message.channel.activeCollector)
      return message.reply("Um coletor de mensagens já está ativo neste canal.");
    if (!message.member.voice.channel)
      return message.reply("Você precisa entrar em um canal de voz primeiro!").catch(console.error);

    const search = args.join(" ");

    let resultsEmbed = new MessageEmbed()
      .setTitle(`**Responda com o número da música que deseja tocar**`)
      .setDescription(`Resultados para: ${search}`)
      .setColor("#F8AA2A");

    try {
      const results = await youtube.searchVideos(search, 10);
      results.map((video, index) => resultsEmbed.addField(video.shortURL, `${index + 1}. ${video.title}`));

      var resultsMessage = await message.channel.send(resultsEmbed);

      function filter(msg) {
        const pattern = /(^[1-9][0-9]{0,1}$)/g;
        return pattern.test(msg.content) && parseInt(msg.content.match(pattern)[0]) <= 10;
      }

      message.channel.activeCollector = true;
      const response = await message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ["time"] });
      const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;

      message.channel.activeCollector = false;
      message.client.commands.get("play").execute(message, [choice]);
      resultsMessage.delete().catch(console.error);
    } catch (error) {
      console.error(error);
      message.channel.activeCollector = false;
    }
  }
};
