const fetch = require('node-fetch');
const { Client, Intents } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Functions

// Get Username and Tagline
const getUser = (id) => {
	const valoId = id.substring(id.indexOf(' ') + 1, id.length);
	const username = encodeURI(valoId.split('#')[0]);
	const tag = encodeURI(valoId.split('#')[1]);
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
	let str = '';
	await fetch(
		`https://api.henrikdev.xyz/valorant/v3/matches/ap/${username}/${tag}`
	)
		.then((res) => res.json())
		.then((data, err) => {
			if (data.status != 200) throw err;
			let id = data.puuid;
			for (let i of data.data) {
				if (i.metadata.mode === undefined || i.metadata.mode === 'Custom Game')
					continue;

				str += `**${i.metadata.mode} : ${i.metadata.map}** \n`;

				if (i.metadata.mode !== 'Deathmatch') {
					str += i.teams.blue.has_won ? '**Won** \n' : '**Lost** \n';
					str += `${i.teams.blue.rounds_won} : ${i.teams.red.rounds_won} \n`;
				}

				for (let player of i.players.all_players) {
					if (id === player.puuid) {
						str += `K : ${player.stats.kills} | D : ${player.stats.deaths} | A : ${player.stats.assists} \n \n`;
						break;
					}
				}
			}
		});
	return str;
};

// Get the server status
const getStatus = () => {
	return fetch('https://api.henrikdev.xyz/valorant/v1/status/ap')
		.then((res) => res.json())
		.then((data) => {
			if (data.status != 200) return false;
			return true;
		})
		.catch((err) => false);
};

// Get patch notes
const getPatch = () => {
	return fetch(
		'https://api.henrikdev.xyz/valorant/v1/website/en-us?filter=game_updates'
	)
		.then((res) => res.json())
		.then((data, err) => {
			if (data.status != 200) throw err;
			return data.data[0];
		})
		.catch((err) => err.msg);
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
	if (msg.content === '>help') {
		msg.channel.send(
			'>>> **Commands** : \n **>rank username#tag** : To view your rank \n **>recent username#tag** : To get the stats of recently played matches \n **>status** : To check the server status \n **>patch** : To get the latest patch notes'
		);
		return;
	}

	// Rank command
	if (msg.content.startsWith('>rank ')) {
		if (msg.content.includes('#') === false) {
			msg.channel.send('Use this format to get the rank : !!rank username#tag');
			return;
		}
		const { username, tag } = getUser(msg.content);
		getRank(username, tag).then((rank) =>
			msg.channel.send(`<@${msg.author.id}> : ` + rank)
		);
	}

	// History command
	if (msg.content.startsWith('>recent ')) {
		if (msg.content.includes('#') === false) {
			msg.channel.send(
				'Use this format to get the match summary : !!history username#tag'
			);
			return;
		}
		const { username, tag } = getUser(msg.content);

		getHistory(username, tag)
			.then((history) => {
				msg.channel.send(`>>> <@${msg.author.id}> \n \n` + history);
			})
			.catch((err) => msg.channel.send('Invalid username or tag !!'));
		return;
	}

	// Server Status command
	if (msg.content.startsWith('>status')) {
		msg.channel.send(
			getStatus() ? 'Server is up and running !!' : 'Server Down !!'
		);
	}

	// Patch Notes command
	if (msg.content.startsWith('>patch')) {
		getPatch().then((patch) => {
			msg.channel.send(`>>> Read Here : ${patch.url}`, {
				files: [patch.banner_url],
			});
		});
	}
});

// Client Login
client.login('ODc2MDE2ODU2NTU1NzI4OTA2.YRd8Rg.HYSiOyXzh8r_4MIFSwz_4HEs2yU');

//client.login(process.env.TOKEN);
