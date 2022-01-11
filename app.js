const fetch = require('node-fetch');
const { Client, Intents, MessageEmbed, Channel } = require('discord.js');
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// ->Functions

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
		.then(handleErrors)
		.then((res) => res.json())
		.then((data) => data.data.currenttierpatched)
		.catch(() => 'Invalid username / Not enough recent competitive games.');
};

const getCompetitiveHistory = (username, tag) => {
	let str = '';
	return fetch(
		`https://api.henrikdev.xyz/valorant/v1/mmr-history/ap/${username}/${tag}`
	)
		.then(handleErrors)
		.then((res) => res.json())
		.then((data) => {
			str += `**${data.name} : ${data.tag}** \n`;
			for (let i of data.data) {
				str += `**Played on**: ${i.date} \n`;
				str += `**Rank**: ${i.currenttierpatched} \n`;
				if (i.mmr_change_to_last_game > 0)
					str += `**RR Change**: +${i.mmr_change_to_last_game} \n`;
				else str += `**RR Change**: ${i.mmr_change_to_last_game} \n`;
				str += `**ELO**: ${i.elo} \n \n`;
			}
			return str;
		})
		.catch(() => 'Invalid username / Not enough recent competitive games.');
};

// Get the match history
const getHistory = async (username, tag) => {
	let str = '';
	await fetch(
		`https://api.henrikdev.xyz/valorant/v3/matches/ap/${username}/${tag}`
	)
		.then(handleErrors)
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
			for (let i of data.data) {
				if (i.metadata.mode === undefined || i.metadata.mode === 'Custom Game')
					continue;

				str += `**${i.metadata.mode} : ${i.metadata.map}** \n`;

				for (let player of i.players.all_players) {
					if (i.metadata.mode !== 'Deathmatch') {
						if (player.team === 'Red') {
							str += i.teams.red.has_won ? '**Won** \n' : '**Lost** \n';
							str += `${i.teams.red.rounds_won} : ${i.teams.blue.rounds_won} \n`;
						} else {
							str += i.teams.blue.has_won ? '**Won** \n' : '**Lost** \n';
							str += `${i.teams.blue.rounds_won} : ${i.teams.red.rounds_won} \n`;
						}
					}
					str += `K : ${player.stats.kills} | D : ${player.stats.deaths} | A : ${player.stats.assists} \n \n`;
					break;
				}
			}
		})
		.catch((err) => err);
	return str;
};

// Get the server status
const getStatus = () => {
	return fetch('https://api.henrikdev.xyz/valorant/v1/status/ap')
		.then((res) => res.json())
		.then(handleErrors)
		.then((data) => true)
		.catch(() => false);
};

// Get patch notes
const getPatch = () => {
	return fetch(
		'https://api.henrikdev.xyz/valorant/v1/website/en-us?filter=game_updates'
	)
		.then((res) => res.json())
		.then(handleErrors)
		.then((data) => {
			for (let i of data.data) {
				if (i.title.includes('Patch')) return i.url;
			}
		})
		.catch((err) => err);
};

// Handle Errors
const handleErrors = (res) => {
	if (res.status != 200) {
		throw Error('Failed to load. Try again later !!');
	}
	return res;
};

// ->Data

// Ranks
const ranks = {
	'Iron 1': 3,
	'Iron 2': 4,
	'Iron 3': 5,
	'Bronze 1': 6,
	'Bronze 2': 7,
	'Bronze 3': 8,
	'Silver 1': 9,
	'Silver 2': 10,
	'Silver 3': 11,
	'Gold 1': 12,
	'Gold 2': 13,
	'Gold 3': 14,
	'Platinum 1': 15,
	'Platinum 2': 16,
	'Platinum 3': 17,
	'Diamond 1': 18,
	'Diamond 2': 19,
	'Diamond 3': 20,
	'Immortal 1': 21,
	'Immortal 2': 22,
	'Immortal 3': 23,
	Radiant: 24,
};

// ->Events

// Ready event
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

// Message event
client.on('messageCreate', async (msg) => {
	if (msg.author.bot) return;

	// Help command
	if (msg.content === '>help') {
		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('COMMANDS')
			.setThumbnail('https://c.tenor.com/wuYSt-pgcoEAAAAM/valorant-games.gif')
			.setDescription(
				'`>rank username#tag` - Shows your rank \n `>recent username#tag` - Shows recently played matches \n `>competitive username#tag` - Shows rank changes in competitive matches \n `>status` - Shows the server status \n `>patch` - Shows the latest patch notes'
			)
			.setTimestamp();

		msg.reply({ embeds: [embed] });

		return;
	}

	// Rank command
	if (msg.content.startsWith('>rank ')) {
		if (msg.content.includes('#') === false) {
			msg.reply('Use this format to get the rank : >rank username#tag');
			return;
		}

		const { username, tag } = getUser(msg.content);
		getRank(username, tag).then((rank) => {
			const embed = new MessageEmbed()
				.setColor('#228c22')
				.setTitle('RANK')
				.setThumbnail(
					`https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiers/${ranks[rank]}.png`
				)
				.setDescription(rank);
			msg.reply({ embeds: [embed] });
		});
		return;
	}

	if (msg.content.startsWith('>competitive')) {
		if (msg.content.includes('#') === false) {
			msg.reply(
				'Use this format to get the match summary : !!history username#tag'
			);
			return;
		}
		const { username, tag } = getUser(msg.content);

		getCompetitiveHistory(username, tag).then((comp) => {
			//console.log(comp);
			const embed = new MessageEmbed()
				.setColor('#B026FF')
				.setTitle('COMPETITIVE HISTORY')
				.setThumbnail('https://c.tenor.com/wuYSt-pgcoEAAAAM/valorant-games.gif')
				.setDescription(comp)
				.setTimestamp();
			msg.reply({ embeds: [embed] });
		});
	}

	// History command
	if (msg.content.startsWith('>recent ')) {
		if (msg.content.includes('#') === false) {
			msg.reply(
				'Use this format to get the match summary : !!history username#tag'
			);
			return;
		}
		const { username, tag } = getUser(msg.content);

		getHistory(username, tag)
			.then((history) => {
				const embed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle('RECENT MATCHES')
					.setThumbnail(
						'https://c.tenor.com/wuYSt-pgcoEAAAAM/valorant-games.gif'
					)
					.setDescription(history)
					.setTimestamp();
				msg.reply({ embeds: [embed] });
			})
			.catch((err) => msg.reply('Invalid username or tag !!'));
		return;
	}

	// Server Status command
	if (msg.content.startsWith('>status')) {
		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('SERVER STATUS')
			.setThumbnail('https://c.tenor.com/wuYSt-pgcoEAAAAM/valorant-games.gif')
			.setDescription(
				getStatus()
					? 'Server is up and running fine !!'
					: 'Server is down right now. Please try again after some time !!'
			);
		msg.reply({ embeds: [embed] });
		return;
	}

	// Patch Notes command
	if (msg.content.startsWith('>patch')) {
		getPatch().then((patch) => {
			msg.reply('>>> Read Here : ' + patch);
		});
		return;
	}
});

// Client Login
client.login(process.env.TOKEN);
