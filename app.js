const fetch = require('node-fetch');
const { Client, Intents } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Functions

const getRank = (username, tag) => {
	return fetch(
		`https://api.henrikdev.xyz/valorant/v1/mmr/ap/${username}/${tag}`
	)
		.then((res) => res.json())
		.then((data) => data.data.currenttierpatched);
};

const getHistory = async (username, tag) => {
	let matches = [];
	await fetch(
		`https://api.henrikdev.xyz/valorant/v3/matches/ap/${username}/${tag}`
	)
		.then((res) => res.json())
		.then((data) => {
			for (let i of data.data) {
				let match = {
					map: i.metadata.map,
					mode: i.metadata.mode,
				};
				for (let player of i.players.all_players) {
					if (player.name === username && player.tag === tag) {
						match.kda = `K : ${player.stats.kills} | D : ${player.stats.deaths} | A : ${player.stats.assists}`;
						break;
					}
				}
				if (i.metadata.mode === 'Deathmatch') {
					match.won = null;
					match.score = null;
				} else {
					match.won = i.teams.red.has_won ? 'Won' : 'Lost';
					match.score = `${i.teams.red.rounds_won} : ${i.teams.blue.rounds_won}`;
				}

				matches.push(match);
			}
		});
	return matches;
};

// Events

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
	if (msg.author.bot) return;

	msg.content = msg.content.toLowerCase();

	if (msg.content === '!help') {
		msg.channel.send(
			'You can use the following commands : \n >>>  !rank username#tag \n !history username#tag'
		);
		return;
	}

	if (msg.content.startsWith('!rank')) {
		const valoId = msg.content.split(' ');
		if (valoId.length < 2) {
			msg.channel.send('Use this format to get your rank : !rank username#tag');
			return;
		}
		const username = valoId[1].split('#')[0];
		const tag = valoId[1].split('#')[1];

		getRank(username, tag).then((rank) => msg.channel.send(rank));
	}

	if (msg.content.startsWith('!history')) {
		const valoId = msg.content.split(' ');
		if (valoId.length < 2) {
			msg.channel.send(
				'Use this format to get the match history : !history username#tag'
			);
			return;
		}
		const username = valoId[1].split('#')[0];
		const tag = valoId[1].split('#')[1];

		getHistory(username, tag).then((history) => {
			for (let i of history) {
				if (i.mode === 'Deathmatch') {
					msg.channel.send(` >>> ${i.mode} : ${i.map} \n ${i.kda}`);
				} else {
					msg.channel.send(
						` >>> ${i.mode} : ${i.map} \n ${i.kda} \n ${i.won} \n ${i.score}`
					);
				}
			}
		});
		return;
	}

	if (msg.content === 'ping') {
		msg.channel.send('pong');
		return;
	}
});

// Client Login

//client.login('ODc2MDE2ODU2NTU1NzI4OTA2.YRd8Rg.HYSiOyXzh8r_4MIFSwz_4HEs2yU');

client.login(process.env.TOKEN);
