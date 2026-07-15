const path = require('path');
const mongoose = require('mongoose');
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { silentExit } = require('./helpers');
const { User, Conversation, Message } = require('@librechat/data-schemas').createModels(mongoose);
const connect = require('./connect');

function getArgValue(flagName) {
  const flag = `--${flagName}`;
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx === process.argv.length - 1) {
    return undefined;
  }
  return process.argv[idx + 1];
}

function parseIsoDate(raw, label) {
  if (raw == null) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    console.red(`Invalid ${label}: expected a valid ISO 8601 datetime string`);
    process.exit(1);
  }
  return parsed;
}

function buildCreatedAtRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return undefined;
  }
  const range = {};
  if (startDate) {
    range.$gte = startDate;
  }
  if (endDate) {
    range.$lte = endDate;
  }
  return range;
}

function countFilterForUser(userId, createdAtRange) {
  const base = { user: userId };
  if (!createdAtRange) {
    return base;
  }
  return { ...base, createdAt: createdAtRange };
}

(async () => {
  await connect();

  const startRaw = getArgValue('startDate');
  const endRaw = getArgValue('endDate');
  const startDate = parseIsoDate(startRaw, 'startDate');
  const endDate = parseIsoDate(endRaw, 'endDate');

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    console.red('startDate must be before or equal to endDate');
    process.exit(1);
  }

  const createdAtRange = buildCreatedAtRange(startDate, endDate);

  /**
   * Show the welcome / help menu
   */
  console.purple('-----------------------------');
  console.purple('Show the stats of all users');
  if (createdAtRange) {
    console.purple(
      `Date filter on conversations/messages createdAt: ${JSON.stringify({
        ...(createdAtRange.$gte && { start: createdAtRange.$gte.toISOString() }),
        ...(createdAtRange.$lte && { end: createdAtRange.$lte.toISOString() }),
      })}`,
    );
  }
  console.purple('-----------------------------');

  let users = await User.find({});
  let userData = [];
  for (const user of users) {
    const filter = countFilterForUser(user._id, createdAtRange);
    let conversationsCount = (await Conversation.countDocuments(filter)) ?? 0;
    let messagesCount = (await Message.countDocuments(filter)) ?? 0;

    userData.push({
      User: user.name,
      Email: user.email,
      Conversations: conversationsCount,
      Messages: messagesCount,
    });
  }

  userData.sort((a, b) => {
    if (a.Conversations !== b.Conversations) {
      return b.Conversations - a.Conversations;
    }

    return b.Messages - a.Messages;
  });

  console.table(userData);

  silentExit(0);
})();

process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    console.error('There was an uncaught error:');
    console.error(err);
  }

  if (!err.message.includes('fetch failed')) {
    process.exit(1);
  }
});
