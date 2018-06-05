/*
 * dfbot
 * powered by nxtbot
 * by your average cat, ry00001
 * version "I have no idea what I'm doing"
 * builds: passing (probably at least)
 */

const Eris = require('eris')
const handler = require('./src/handler.js')
const superagent = require('superagent')
var config = {};
if (process.env.CI) { 
    config = {
        discord: {
            token: 'FAKE'
        },
        bot: {
            prefixes: ['FAKE'],
            owners: ['12345'],
            options: {}
        }
    }
} else {
    config = require('./config.json')
}
const Redite = require('redite')
const util = require('util')
const bot = new handler.Nxtbot(config.discord.token, process.env.CI, config.bot.prefixes, config.bot.options, config.bot.owners, config)

console.log('dfbot starting...')

const run = () => {
    let ci = process.env.CI
    if (ci) {
        console.log('Continuous Integration detected, loading all modules then exiting...');
        bot.loadDir(bot.options.commandsDir);
        process.exit(0);
    } else {
        bot.db = new Redite({url: config.bot.redis_url});
        bot.connect();
    }
}

var currGame = 0;

var cycleGame = () => {
    let games = [
        {name: 'Dwarf Fortress', type: 0},
        {name: 'keyboards', type: 2},
        {name: 'now open-source!', type: 0},
        {name: 'Powered by nxtbot!', type: 0},
        {name: 'https://gitea.ry00001.me/ry00001/dfbot', type: 0}
    ]
    currGame++;
    if (currGame >= games.length) currGame = 0;
    bot.editStatus('online', {name: games[currGame].name + ` | ${bot.prefixes[0]}help - ${bot.guilds.size} servers`, type: games[currGame].type})
}


var makeGuildInfo = g => {
    bot.db[g.id].get.then(a => {
        if (!a || !a.settings || !a.punishments) {
            console.log('Creating information for guild ' + g.name)
            bot.db[g.id].set({settings: {}, punishments: []})
        }
    })
}

var delGuildInfo = g => {
    console.log('Deleting information for guild ' + g.name)
    bot.db[g.id].set({})
}

bot.on('guildCreate', g => {
    makeGuildInfo(g)
})

bot.on('guildDelete', g => {
    delGuildInfo(g) // clean up after ourselves
})

bot.on('ready', () => {
    console.log(`Ready, connected as ${bot.user.username}#${bot.user.discriminator} (${bot.user.id})`)
    if (!bot.bot) {
        console.log('dfbot can only be ran under bot accounts. Exiting...')
        process.exit(1);
    }

    bot.db.strikes.exists().then(r => {
        if (!r) {
            bot.db.strikes.set({})
        }
    })

    for (let guild of bot.guilds) {
        makeGuildInfo(guild[1]) // [1] is required because lol collections.
    }

    cycleGame();
    setInterval(() => cycleGame(), 120000)
})

bot.cmdEvent('commandError', async (ctx, err) => {
    let etext = `\`\`\`${err.stack}\`\`\``
    if (etext.length > 2000) {
        superagent.post('https://hastebin.com/documents')
            .type('text/plain')
            .send(err.stack)
            .then(a => {
                etext = `[Error too long to display nicely](https://hastebin.com/${a.body.key})`
            })
    }
    await ctx.send({
        embed: {
            title: 'Command error',
            description: `Well, this is embarrassing. 
It appears an error has happened in dfbot's source code.
This isn't your fault, but you may want to tell ry00001#3487 about this! Make sure to tell him where it happened, and what command you ran!`,
            fields: [{
                name: 'Error details',
                value: `\`\`\`${err}\`\`\``,
                inline: false
            }]
        }
    })
})

bot.cmdEvent('commandNoDM', async ctx => {
    await ctx.send(':x: | This command cannot be used in Direct Messages.')
})

bot.cmdEvent('commandNotOwner', async ctx => { 
    let msgs = [`\`dfbot cancels job "run ${ctx.command.name}": Invalid permissions.\``]
    await ctx.send(msgs[Math.floor(Math.random() * msgs.length)])
})

bot.cmdEvent('commandNoPermissions', async ctx => {
    await ctx.send(':no_entry_sign: | Invalid permissions.')
})

bot.cmdEvent('commandBotNoPermissions', async ctx => {
    await ctx.send(':no_entry_sign: | The bot doesn\'t have enough permissions to run this.')
})

run();