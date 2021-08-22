const fetch = require('node-fetch');
const { Client, Intents, MessageEmbed } = require('discord.js');
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

				for (let player of i.players.all_players) {
					if (id === player.puuid) {
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
		const embed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('COMMANDS')
			.setThumbnail('https://c.tenor.com/wuYSt-pgcoEAAAAM/valorant-games.gif')
			.setDescription(
				'`>rank username#tag` - Shows your rank \n `>recent username#tag` - Shows recently played matches \n `>status` - Shows the server status \n `>patch` - Shows the latest patch notes'
			)
			.setTimestamp();

		msg.reply({ embeds: [embed] });

		return;
	}

	// Rank command
	if (msg.content.startsWith('>rank ')) {
		if (msg.content.includes('#') === false) {
			msg.reply('Use this format to get the rank : !!rank username#tag');
			return;
		}

		const { username, tag } = getUser(msg.content);
		getRank(username, tag).then((rank) => {
			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('RANK')
				.setDescription(rank);
			msg.reply({ embeds: [embed] });
		});
		return;
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
			msg.reply('>>> Read Here : ' + patch.url);
		});
		return;
	}
});

// Client Login
client.login('ODc2MDE2ODU2NTU1NzI4OTA2.YRd8Rg.HYSiOyXzh8r_4MIFSwz_4HEs2yU');

//client.login(process.env.TOKEN);
