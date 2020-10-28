const { play } = require("../include/play");
const { YOUTUBE_API_KEY, SOUNDCLOUD_CLIENT_ID } = require("../config.json");

const ytdl = require("ytdl-core");

const YouTubeAPI = require("simple-youtube-api");
// Load the full build.
var __ = require('lodash');
var debounced_youtube = __.debounce(YouTubeAPI, 200);
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const scdl = require("soundcloud-downloader");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo play!`);


function funcTempo(arg) {
  console.log(`Tempo de => ${arg}`);
  logger.info(`Tempo de => ${arg}`);
}



module.exports = {
  name: "play",
  cooldown: 3,
  aliases: ["p","tocar","t"],
  description: "Reproduz áudio do YouTube ou do Soundcloud",
  async execute(message, args) {
    const { channel } = message.member.voice;

    const serverQueue = message.client.queue.get(message.guild.id);
    if (!channel) return message.reply("Você precisa entrar em um canal de voz primeiro!")
                          .catch(console.error);
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message.reply(`Você deve estar no mesmo canal que ${message.client.user}`)
                .catch(console.error);

    if (!args.length)
      return message
        .reply(`Uso: ${message.client.prefix}play <URL do YouTube | Nome do Video | URL do Soundcloud>`)
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply("Não é possível conectar ao canal de voz, permissões ausentes");
    if (!permissions.has("SPEAK"))
      return message.reply("Não posso falar neste canal de voz, verifique se tenho as permissões adequadas!");

    const search = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 100,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        try {
          songInfo = await ytdl.getInfo(url);  
        } catch (error) {
          logger.error(`Error (1): ${error.message ? error.message : error}`);
          logger.debug(error);
          if (error.message === 'Status code: 429') {
              // refreh token
              setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [1]');
              // try again
              try {
                songInfo = await ytdl.getInfo(url);  
              } catch (error2) {
                logger.error(`Error (2): ${error2.message ? error2.message : error2}`);
                logger.debug(error2);
                if (error2.message === 'Status code: 429') {
                    // refreh token
                    setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [2]');
                    // try again
                    try {
                      songInfo = await ytdl.getInfo(url);  
                    } catch (error3) {
                      logger.error(`Error (3): ${error3.message ? error3.message : error3}`);
                      logger.debug(error3);
                      if (error2.message === 'Status code: 429') {
                        // refreh token
                        setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [3]');
                        // try again
                        try {
                          songInfo = await ytdl.getInfo(url);  
                        } catch (error4) {
                          logger.error(`Error (4): ${error4.message ? error4.message : error4}`);
                          logger.debug(error4);
                          setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [4]');
                          songInfo = await ytdl.getInfo(url);  
                        }
                    }
                    }
                }
              }
          }
        }
        
        try{
          if(songInfo !== null && songInfo.videoDetails !== null)
          {
            song = {
              title: songInfo.videoDetails.title,
              url: songInfo.videoDetails.video_url,
              duration: songInfo.videoDetails.lengthSeconds,
              // hours: songInfo.videoDetails.duration.hours,
              // minutes: songInfo.videoDetails.duration.minutes,
              // seconds: songInfo.videoDetails.duration.seconds,
              // publishedAt: songInfo.videoDetails.publishedAt,
              shortURL: songInfo.videoDetails.shortURL,
              longUrl: songInfo.videoDetails.url,
              description: songInfo.videoDetails.description
            };
          } else
          {
            song = {
              title: songInfo.info.title,
              url: songInfo.info.video_url,
              duration: songInfo.info.lengthSeconds,
              // hours: songInfo.info.duration.hours,
              // minutes: songInfo.info.duration.minutes,
              // seconds: songInfo.info.duration.seconds,
              // publishedAt: songInfo.info.publishedAt,
              shortURL: songInfo.info.shortURL,
              longUrl: songInfo.info.url,
              description: songInfo.info.description
            };
          }
        }
        catch (error) {
          logger.error(`Error SONG --- Play : ${error.message ? error.message : error}`);
          logger.debug(error);
          song = {
            title: songInfo.video_url,
            url: songInfo.video_url,
            //duration: songInfo.lengthSeconds,
            // hours: songInfo.duration.hours,
            // minutes: songInfo.duration.minutes,
            // seconds: songInfo.duration.seconds,
            // publishedAt: songInfo.publishedAt,
            //shortURL: songInfo.shortURL,
            // longUrl: songInfo.url,
            // description: songInfo.description
          };
        }
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    } else if (scRegex.test(url)) {
      try {
        const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID);
        song = {
          title: trackInfo.title,
          url: trackInfo.permalink_url,
          duration: trackInfo.duration / 1000
        };
      } catch (error) {
        if (error.statusCode === 404)
          return message.reply("Não foi possível encontrar essa faixa do Soundcloud.").catch(console.error);
        return message.reply("Ocorreu um erro ao reproduzir essa faixa do Soundcloud.").catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchVideos(search, 1);
        try {
          songInfo = await ytdl.getInfo(results[0].url);  
        } catch (error) {
          logger.error(`Error (1): ${error.message ? error.message : error}`);
          logger.debug(error);
          if (error.message === 'Status code: 429') {
              // refreh token
              setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [1]');
              // try again
              try {
                songInfo = await ytdl.getInfo(results[0].url);  
              } catch (error2) {
                logger.error(`Error (2): ${error2.message ? error2.message : error2}`);
                logger.debug(error2);
                if (error2.message === 'Status code: 429') {
                    // refreh token
                    setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [2]');
                    // try again
                    try {
                      songInfo = await ytdl.getInfo(results[0].url);  
                    } catch (error3) {
                      logger.error(`Error (3): ${error3.message ? error3.message : error3}`);
                      logger.debug(error3);
                      if (error2.message === 'Status code: 429') {
                        // refreh token
                        setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [3]');
                        // try again
                        try {
                          songInfo = await ytdl.getInfo(results[0].url);  
                        } catch (error4) {
                          logger.error(`Error (4): ${error4.message ? error4.message : error4}`);
                          logger.debug(error4);
                          setTimeout(funcTempo, 1500, 'await ytdl.getInfo(url) [4]');
                          songInfo = await ytdl.getInfo(results[0].url);  
                        }
                    }
                    }
                }
              }
          }
        }
        try{
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds,
          shortURL: songInfo.videoDetails.shortURL,
          longUrl: songInfo.videoDetails.url,
          description: songInfo.videoDetails.description
        };
        } catch (error) {
          logger.error(`Error SONG ----: ${error.message ? error.message : error}`);
          logger.debug(error);
          song = {
            title: songInfo.title,
            url: songInfo.video_url,
            duration: songInfo.lengthSeconds,
            shortURL: songInfo.shortURL,
            longUrl: songInfo.url,
            description: songInfo.description
          };
        }
      } catch (error) {
        console.error(error);
        logger.error(`Error: ${error.message ? error.message : error}`);
        logger.debug(error);
        return message.reply("Nenhum vídeo foi encontrado com um título correspondente").catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      return serverQueue.textChannel
        .send(`✅ **${song.title}** foi adicionado à fila por ${message.author}`)
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id).catch(console.error);
      await channel.leave();
      return message.channel.send(`Não foi possível entrar no canal: ${error}`)
              .catch(console.error);
    }
  }
};
