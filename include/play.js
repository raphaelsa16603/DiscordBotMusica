const ytdlDiscord = require("ytdl-core-discord");
const scdl = require("soundcloud-downloader");
const { canModifyQueue } = require("../util/EvobotUtil");

// Load the full build.
var _ = require('lodash');

var debounced_ytdl = _.debounce(ytdlDiscord, 200);

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo tocar Song!`);



module.exports = {
  async play(song, message) {
    const { PRUNING, SOUNDCLOUD_CLIENT_ID } = require("../config.json");
    const queue = message.client.queue.get(message.guild.id);

    try {
      logger.info(`play(song, message) Song: ${song.title} - Guild.id: ${message.guild.id}`);  
    } catch (error) {
      logger.info(`play(song, message) Song: ??? - Guild.id: ${message.guild.id}`);
    }
    

    if (!song) {
      try {
        queue.channel.leave();
        message.client.queue.delete(message.guild.id).catch(console.error);
        return queue.textChannel.send("🚫 A fila de músicas terminou.").catch(console.error);
      } catch (error) {
        logger.error(`Error: ${error.message ? error.message : error}`);
        logger.debug(error);
        return queue.textChannel.send("🚫 A fila de músicas terminou.").catch(console.error);
      }

    }
    


    let stream = null;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";

    try {
      if (song.url.includes("youtube.com")) {
        // Buffer do Youtube para evitar corte da música { highWaterMark: 1 << 25 }
        stream = await ytdlDiscord(song.url, { highWaterMark: 1 << 25 });
        try {
          logger.info(`play youtube = Song url: ${song.url}`);  
        } catch (error) {
          logger.info(`play youtube = Song url: ???`);
        }

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
        
      } else if (song.url.includes("soundcloud.com")) {
        try {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, SOUNDCLOUD_CLIENT_ID ? SOUNDCLOUD_CLIENT_ID : undefined);
          logger.info(`play soundcloud = Song url: ${song.url}`);
        } catch (error) {
          logger.error(`Error: ${error.message ? error.message : error}`);
          logger.debug(error);
          try {
            logger.info(`play soundcloud (2x) = Song url: ${song.url}`);  
          } catch (error) {
            logger.info(`play soundcloud (2x) = Song url: ???`);
          }
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, SOUNDCLOUD_CLIENT_ID ? SOUNDCLOUD_CLIENT_ID : undefined);
          streamType = "unknown";
        }
      }
    } catch (error) {
      try {
        if (queue) {
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      } catch (error2) {
        console.error(error2);
        logger.error(`Error: ${error2.message ? error2.message : error2}`);
        logger.debug(error2);
      }
      

      console.error(error);
      logger.error(`Error: ${error.message ? error.message : error}`);
      logger.debug(error);
      return message.channel.send(`Error: ${error.message ? error.message : error}`);
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id)
                        .catch(err => {
                          console.log(`Erro on queue.connection.on("disconnect" ...: ${err}`);
                          console.error(err);
                          logger.error(`Erro on queue.connection.on("disconnect" ...: ${err}`);
                          logger.debug(error);
                        }));

    // Dica de código de bot de musica --- https://github.com/reisdev/bot-discord-node
    /*
    queue.dispatcher = await queue.connection.play(
    await ytdl(song.url, { highWaterMark: 1 << 25, filter: "audioonly" }),
      {
        type: "opus",
      }
    );
    queue.dispatcher.on("finish", () => {
      queue.songs.shift();
      playSong(bot, msg, queue.songs[0]);
      });
    */
    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        logger.info(`play on finish!`);

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        logger.info(`play on error!`);
        logger.error(`Error: ${err.message ? err.message : err}`);
        logger.debug(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      var playingMessage = await queue.textChannel.send(`🎶 Começou a tocar: **${song.title}** ${song.url}`);
      try {
        logger.info(`🎶 Começou a tocar: **${song.title}** ${song.url} - ${song.durationSeconds}`);    
      } catch (error) {
        try {
          logger.info(`🎶 Começou a tocar: **${song.title}** ${song.url}`);
        } catch (error) {
          logger.info(`🎶 Começou a tocar: ${song.title}`);
        }
      }
      
      await playingMessage.react("⏭");
      await playingMessage.react("⏯");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
    } catch (error) {
      console.error(error);
      try {
        logger.info(`error ao tocar ${song.title}!`);  
      } catch (error) {
        logger.info(`error ao tocar ???!`);
      }
      logger.error(`Error: ${error.message ? error.message : error}`);
      logger.debug(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      logger.info(`play on collect!`);
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏩ pulou a música`).catch(console.error);
          logger.info(`${user} ⏩ pulou a música`);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(`${user} ⏸ pausou a música.`).catch(console.error);
            logger.info(`${user} ⏸ pausou a música.`);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(`${user} ▶ retomou a música!`).catch(console.error);
            logger.info(`${user} ▶ retomou a música!`);
          }
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.loop = !queue.loop;
          queue.textChannel.send(`Loop é agora ${queue.loop ? "**on**" : "**off**"}`).catch(console.error);
          try {
            logger.info(`Loop é agora ${queue.loop ? "**on**" : "**off**"}`);  
          } catch (error) {
            logger.info(`Loop é agora ....`);
          }
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.songs = [];
          queue.textChannel.send(`${user} ⏹ parou a música!`).catch(console.error);
          logger.info(`${user} ⏹ parou a música!`);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            logger.error(`Error: ${error.message ? error.message : error}`);
            logger.debug(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
      if (PRUNING && playingMessage && !playingMessage.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });
  }
};
