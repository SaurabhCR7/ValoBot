const fetch = require('node-fetch');
const { Client, Intents } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Functions

// Get Username and Tagline
const getUser = (id) => {
	const valoId = id.substring(id.indexOf(' ') + 1, id.length);
	const username = valoId.split('#')[0];
	const tag = valoId.split('#')[1];
	return { username, tag };
};

// Get the Rank of the player
const getRank = (username, tag) => {
	return fetch(
		`https://api.henrikdev.xyz/valorant/v1/mmr/ap/${username}/${tag}`
	)
		.then((res) => res.json())
		.then((data) => {
			if (data.status != 200) return 'Invalid username or tag !!';
			else return data.data.currenttierpatched;
		})
		.catch((err) => 'The account has not acquired a rank yet !!');
};

// Get the match history
const getHistory = async (username, tag) => {
	let matches = [];
	await fetch(
		`https://api.henrikdev.xyz/valorant/v3/matches/ap/${username}/${tag}`
	)
		.then((res) => res.json())
		.then((data, err) => {
			if (data.status != 200) throw err;
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
				if (i.metadata.mode === 'Custom Game') {
					continue;
				} else if (i.metadata.mode === 'Deathmatch') {
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

// Ready event
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

// Message event
client.on('messageCreate', async (msg) => {
	if (msg.author.bot) return;

	// Help command
	if (msg.content === '!!help') {
		msg.channel.send(
			'You can use the following commands : \n >>>  !!rank username#tag \n !!history username#tag'
		);
		return;
	}

	// Rank command
	if (msg.content.startsWith('!!rank ')) {
		if (msg.content.includes('#') === false) {
			msg.channel.send('Use this format to get the rank : !!rank username#tag');
			return;
		}
		const { username, tag } = getUser(msg.content);
		getRank(username, tag).then((rank) => msg.channel.send(rank));
	}

	// History command
	if (msg.content.startsWith('!!history ')) {
		if (msg.content.includes('#') === false) {
			msg.channel.send(
				'Use this format to get the match summary : !!history username#tag'
			);
			return;
		}
		const { username, tag } = getUser(msg.content);

		getHistory(username, tag)
			.then((history) => {
				for (let i of history) {
					if (i.mode === 'Deathmatch') {
						msg.channel.send(` >>> ${i.mode} : ${i.map} \n ${i.kda}`);
					} else {
						msg.channel.send(
							` >>> ${i.mode} : ${i.map} \n **${i.score}** \n ${i.kda} \n **${i.won}**`
						);
					}
				}
			})
			.catch((err) => msg.channel.send('Invalid username or tag !!'));
		return;
	}

	if (msg.content === 'ping') {
		msg.channel.send('pong');
		return;
	}
});

// Client Login

client.login('ODc2MDE2ODU2NTU1NzI4OTA2.YRd8Rg.HYSiOyXzh8r_4MIFSwz_4HEs2yU');

//client.login(process.env.TOKEN);
