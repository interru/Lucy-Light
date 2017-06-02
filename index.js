let config  = require('./config/config.json');
let path    = require('path');
let moment  = require('moment');
let discord = require('discord.js-commando');
let brg     = require('./app/service/brg/brg.js');
let youtube = require('./app/service/youtube/youtube.js');

let winston = require('winston');
require('winston-daily-rotate-file');

let logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			formatter: function(options) {
				return moment().format('DD.MM.YYYY, HH:mm:ss') +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
				  (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
			}
		}),
		new winston.transports.DailyRotateFile({
			filename: config.logger.filename,
			datePattern: config.logger.datePattern,
			prepend: true,
			level: config.logger.level
		})
	]
});

let client  = new discord.Client({
	owner: config.discord.ownerId,
	commandPrefix: config.discord.commandPrefix
});

client.registry
    .registerGroups(config.discord.commandGroups)
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'app/command'));

client.on('error', console.error);
client.on('warn', console.warn);
client.on('debug', console.log);

client.on('ready', () => {
	logger.info('Started and ready!');
});

client.on('message', message => {
});

client.on('commandError', (cmd, err) => {
	if (err instanceof discord.FriendlyError) return;
	logger.info('Error in command ' + cmd.groupID + ':' + cmd.memberName, err);
});

client.on('commandBlocked', (msg, reason) => {
	logger.info('Command [' + msg.command.groupID + ':' + msg.command.memberName + '] blocked' + '. Reason: ' + reason);
});

client.on('commandPrefixChange', (guild, prefix) => {
	if (prefix === '') {
		logger.info('Prefix removed in guild ' + guild.name + '(' + guild.id + ')');
	}
	else {
		logger.info('Prefix changed to ' + prefix);
	}
});

client.on('commandStatusChange', (guild, command, enabled) => {
	var consoleMessage = 'Command ' + command.groupID + ':' + command.memberName + ' ';

	if (enabled) {
		consoleMessage += 'enabled';
	}
	else {
		consoleMessage += 'disabled';
	}

	consoleMessage += ' in guild ' + guild.name + ' (' + guild.id + ')';
	logger.info(consoleMessage);
});

client.on('groupStatusChange', (guild, group, enabled) => {
	var consoleMessage = 'Group ' + group.id + ' ';

	if (enabled) {
		consoleMessage += 'enabled';
	}
	else {
		consoleMessage += 'disabled';
	}

	consoleMessage += ' in guild ' + guild.name + ' (' + guild.id + ')';
	logger.info(consoleMessage);
});

client.login(config.discord.botToken);

let updateNowPlayingStatus = setInterval(function() {
	brg.getNowPlaying()
		.then(function(response) {
			let title      = response.data.result.title;
			let artist     = response.data.result.artist;

			logger.info('Set game to "' + title + ' - ' + artist + '"');
			// TODO: Add check if Twitch Stream is online then set to optional parameter as string
			client.user.setGame(title + ' - ' + artist);
		})
		.catch(function(error) {
			logger.error(error);
			client.user.setGame('');
		});
}, config.discord.updateNowPlayingStatusInterval);

exports.config   = config;
exports.moment   = moment;
exports.logger   = logger;
exports.services = {
	'brg': brg,
	'youtube': youtube
}
