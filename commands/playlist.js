const { MessageEmbed } = require("discord.js");
const { play } = require("../include/play");
const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE } = require("../config.json");
// gera erro no includes/play.js: const ytdl_do_pl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");
// Load the full build.
var __ = require('lodash');
var debounced_youtube = __.debounce(YouTubeAPI, 200);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo playlist!`);


module.exports = {
  name: "playlist",
  cooldown: 3,
  aliases: ["pl","lista"],
  description: "Toque uma playlist do youtube",
  async execute(message, args) {
    const { PRUNING } = require("../config.json");
    const { channel } = message.member.voice;

    const serverQueue = message.client.queue.get(message.guild.id);
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message.reply(`Você deve estar no mesmo canal que ${message.client.user}`)
      .catch(err => {
          console.log(`Erro on serverQueue: ${err}`);
          console.error(err);
          logger.error(`Error: ${err.message ? err.message : err}`);
          logger.debug(err);
      });

    if (!args.length)
      return message
        .reply(`Uso: ${message.client.prefix}playlist <URL da Playlist no YouTube | Nome da Playlist>`)
        .catch(err => {
          console.log(`Erro on playlist: ${err}`);
          console.error(err);
          logger.error(`Error: ${err.message ? err.message : err}`);
          logger.debug(err);
        });
    if (!channel) return message.reply("Você precisa entrar em um canal de voz primeiro!")
                        .catch(err => {
                          console.log(`Erro on Canal de voz primeiro: ${err}`);
                          console.error(err);
                          logger.error(`Error: ${err.message ? err.message : err}`);
                          logger.debug(err);
                        });

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("Não é possível conectar ao canal de voz, permissões ausentes");
    if (!permissions.has("SPEAK"))
      return message.reply("Não posso falar neste canal de voz, verifique se tenho as permissões adequadas!");

    const search = args.join(" ");
    const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = pattern.test(args[0]);

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    let song = null;
    let playlist = null;
    let videos = [];

    if (urlValid) {
      try {
        playlist = await youtube.getPlaylist(url, { part: "snippet" });
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
      } catch (error) {
        console.error(error);
        return message.reply("Playlist não encontrada :(").catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchPlaylists(search, 1, { part: "snippet" });
        playlist = results[0];
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
      } catch (error) {
        console.error(error);
        return message.reply("Playlist não encontrada :(").catch(console.error);
      }
    }


    videos.forEach((video) => {
      // Não funciona de jeito nenhum!!!!!!!!!!!!!!!!!!!!!!!!!
      // try {
      //   // Gera erro o uso de outra api let songInfo = ytdl_do_pl.getInfo(video.url);
      //   let songInfo = youtube.getVideo(video.url);
      //   song = {
      //     title: songInfo.title,
      //     url: songInfo.url,
      //     duration: songInfo.durationSeconds,
      //     // hours: songInfo.duration.hours,
      //     // minutes: songInfo.duration.minutes,
      //     // seconds: songInfo.duration.seconds,
      //     // publishedAt: songInfo.publishedAt,
      //     shortURL: songInfo.shortURL,
      //     longUrl: songInfo.url,
      //     description: songInfo.description
      //   };
      // } catch (error) {
      //   console.error(error);
      //   console.log(`Erro no playlist, musica ${video.title}.`);
      //   song = {
      //     title: video.title,
      //     url: video.url,
      //     duration: video.durationSeconds,
      //     // hours: video.duration.hours,
      //     // minutes: video.duration.minutes,
      //     // seconds: video.duration.seconds,
      //     // publishedAt: video.publishedAt,
      //     shortURL: video.shortURL,
      //     longUrl: video.url,
      //     description: video.description
      //   };
      // }
      
      song = {
        title: video.title,
        url: video.url,
        duration: video.durationSeconds,
        // hours: video.duration.hours,
        // minutes: video.duration.minutes,
        // seconds: video.duration.seconds,
        // publishedAt: video.publishedAt,
        shortURL: video.shortURL,
        longUrl: video.url,
        description: video.description
      };

      try {
        logger.info(`Song: ${song.title} - ${song.url} -==- ${song.duration} -==- [${song.description}]`);
      } catch (error) {
        try {
          logger.info(`Song: ${song.title} - ${song.url} - ${song.duration}`);
        } catch (error2) {
          try {
            logger.info(`Song: ${song.title} - ${song.url}`);
          } catch (error3) {
            try {
              logger.info(`Song: ${song.title}`);
            } catch (error4) {
              logger.info(`Song: ???`);
            }
          }
        }
      }

      if (serverQueue) {
        serverQueue.songs.push(song);
        if (!PRUNING)
          message.channel
            .send(`✅ **${song.title}** foi adicionado à fila por ${message.author}`)
            .catch(err => {
              console.log(`Erro on serverQueue.songs.push(${song}): ${err}`);
              console.error(err);
              logger.error(`Error: ${err.message ? err.message : err}`);
              logger.debug(err);
            });
      } else {
        queueConstruct.songs.push(song);
      }
    });

    let playlistEmbed = new MessageEmbed()
      .setTitle(`${playlist.title}`)
      .setURL(playlist.url)
      .setColor("#F8AA2A")
      .setTimestamp();

    if (!PRUNING) {
      playlistEmbed.setDescription(queueConstruct.songs.map((song, index) => `${index + 1}. ${song.title}`));
      if (playlistEmbed.description.length >= 2048)
        playlistEmbed.description =
          playlistEmbed.description.substr(0, 2007) + "\nPlaylist maior que o limite de caracteres...";
    }

    message.channel.send(`${message.author} Iniciou uma playlist`, playlistEmbed);

    if (!serverQueue) message.client.queue.set(message.guild.id, queueConstruct);

    if (!serverQueue) {
      try {
        queueConstruct.connection = await channel.join();
        await queueConstruct.connection.voice.setSelfDeaf(true);
        play(queueConstruct.songs[0], message);
      } catch (error) {
        console.error(error);
        logger.error(`Error: ${error.message ? error.message : error}`);
        logger.debug(error);
        try{
          message.client.queue.delete(message.guild.id).catch(console.error);
        } catch (error2) {
          logger.error(`Error2 --: ${error2.message ? error2.message : error2}`);
          logger.debug(error2);
        }
        await channel.leave();
        return message.channel.send(`Não foi possível entrar no canal: ${error}`).catch(console.error);
      }
    }
  }
};
