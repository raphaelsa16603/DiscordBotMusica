const { MessageEmbed, splitMessage, escapeMarkdown } = require("discord.js");

const logger = require('../util/logger');
logger.info(`Starting the RSAMusicBot módulo queue!`);

//let tempototal = 0;
module.exports = {
  name: "queue",
  aliases: ["q","fila"],
  description: "Mostra a fila de músicas que agora está tocando.",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("Não há nada tocando.").catch(console.error);

    // const description = queue.songs.map((song, index) => `${index + 1}. `+ 
    // `${escapeMarkdown(song.title)} - `+ 
    // `${(new Date(song.duration)).toISOString().substr(11, 8)}`);
    const duracaodamusica = (duracao) => duracao * 1000;

    const description = queue.songs.map((song, index) => `${index + 1}. `+ 
    `${escapeMarkdown(song.title.substr(0,80))} ` + 
    `- ${new Date(duracaodamusica(song.duration)).toISOString().substr(11, 8)}`);

    const somar = (acc, el) => acc + el;
    const calcDuracao = song => song.duration * 1000;
    const duracaoTotal = queue.songs.map(calcDuracao).reduce(somar);
    
    let queueEmbed = new MessageEmbed()
      .setTitle("RSAMusic Fila de Musicas")
      .setDescription(description)
      .setFooter(`Duração total: ` +
      `${new Date(duracaodamusica(duracaoTotal)).toISOString().substr(11, 8)}`)
      .setColor("#F8AA2A");

    const splitDescription = splitMessage(description, {
      maxLength: 2048,
      char: "\n",
      prepend: "",
      append: ""
    });

    splitDescription.forEach(async (m) => {
      queueEmbed.setDescription(m);
      message.channel.send(queueEmbed);
    })


  }
  
};


