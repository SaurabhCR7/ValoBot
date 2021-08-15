const { Client, Intents } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const getQuote = () => {
	fetch('https://zenquotes.io/api/random')
		.then((res) => res.json())
		.then((data) => data[0]['q'] + ' - ' + data[0]['a']);
};

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (msg) => {
	if (msg.author.bot) return;

	if (msg.content === 'inspire') {
		getQuote.then((quote) => msg.channel.send(quote));
	}

	if (msg.content === 'ping') {
		msg.channel.send('pong');
	}
});

client.login(process.env.TOKEN);
