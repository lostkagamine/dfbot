/*
 * nxtbot Command handler
 * @author ry00001
 */

const Eris = require('eris');
const fs = require('fs');
const path = require('path')

class Nxtbot extends Eris.Client {
    constructor(token, isCI = false, prefixes = [], cmdOptions = {}, owners = [], config = {}) {
        super(token);
        this.commands = [];
        this.isCI = isCI;
        if (!isCI) { 
            this.eventHooks = [];
            this.cevents = {};
            this.config = config;
            this.prefixes = prefixes;
            this.cmdOptions = cmdOptions;
            this.owners = owners;

            if (!this.cmdOptions.dontLoadOnStartup) this.loadDir(this.cmdOptions.commandsDir); this.loadEvents(this.cmdOptions.eventsDir)

            this.on('ready', () => {
                // Housekeeping
                if (!this.cmdOptions.noMentionPrefix) {
                    this.prefixes.push(`<@${this.user.id}> `, `<@!${this.user.id}> `);
                }
                if (this.owners === []) {
                    console.warn('No owners registered. Nobody will be able to use owner commands such as eval. The second-to-last argument of the bot constructor is the owners.')
                }
                if (this.prefixes === [] && this.cmdOptions.noMentionPrefix) {
                    console.warn('Warning! The bot has no prefixes registered, and you have chosen to disable mention prefixes! Please add some prefixes or enable mention prefixes, as the bot will be un-triggerable until you do!')
                }
            })

            this.on('messageCreate', m => {
                if (m.author.bot) return;
                let prefix = undefined;
                this.prefixes.forEach(i => {if (m.content.startsWith(i)) { prefix = i }})
                if (prefix === undefined) {
                // no prefix found; drop the message
                    return;
                }
                let text = m.content.slice(prefix.length).split(' ')
                let cmdName = text.shift()
                let cmd = this.findCommand(cmdName)
                let ctx = new Context(this, m, cmd, prefix)
                if (cmd === undefined) {
                // invalid command; drop it again - but fire an event
                    this.cmdDispatch('commandInvalid', [ctx])
                    return;
                }
                if (cmd.ownerOnly && !this.owners.includes(ctx.author.id)) {
                    this.cmdDispatch('commandNotOwner', [ctx])
                    return;
                }
                if (ctx.isDM && !cmd.canBeDM) {
                    this.cmdDispatch('commandNoDM', [ctx])
                    return
                }
                if (!ctx.isDM) {
                    if (!cmd.botAble(ctx.me)) {
                        this.cmdDispatch('commandBotNoPermissions', [ctx])
                        return;
                    }
                    if (!cmd.able(ctx.member)) {
                        this.cmdDispatch('commandNoPermissions', [ctx])
                        return;
                    }
                }
                // fire the command!
                try {
                    cmd.code(ctx, text).catch(e => {
                        this.cmdDispatch('commandError', [ctx, e])
                    })
                } catch(e) { // failsafe in case it's not async because I am kind of an idiot and forget sometimes
                    this.cmdDispatch('commandError', [ctx, e])
                }
            })
        }
    }

    loadCommand(cmdObj) {
        let cmd = new Command(cmdObj.name, cmdObj.code, cmdObj.description, cmdObj.perms, cmdObj.botPerms, cmdObj.ownerOnly, cmdObj.dmable, cmdObj.aliases)
        if (!this.commands.includes(cmd)) this.commands.push(cmd);
    }

    loadEvent(evtObj) {
        for (let j of evtObj.events) {
            if (evtObj.isHandler) {
                this.cmdEvent(j, evtObj.code)
            } else {
                this.on(j, evtObj.code)
            }
        }
    }

    findCommand(name) {
        return this.commands.find(a => a.name === name || a.aliases.includes(name))
    }

    cmdEvent(name, code) {
        if (this.isCI) return;
        if (this.cevents[name] === undefined) {
            this.cevents[name] = []
        }
        this.cevents[name].push(code)
    }

    cmdDispatch(name, args) {
        if (!this.cevents[name]) return;
        this.cevents[name].forEach(i => i(...args).catch(j => console.error(`Error in event ${name}: ${j.stack}`)))
    }

    loadDir(commandsDir = './commands/') {
        fs.readdir(commandsDir, (e, files) => {
            files.forEach(a => {
                let c = require(path.resolve(commandsDir + a))
                if (this.cmdOptions.verbose) console.log(`Adding ${c.name}`)
                this.loadCommand(c)
            })
        })
    }

    loadEvents(dir = './events') {
        fs.readdir(dir, (e, files) => {
            files.forEach(a => {
                let c = require(path.resolve(dir + '/' + a))
                if (this.cmdOptions.verbose) console.log(`Adding event ${c.name}`)
                this.loadEvent(c)
            })
        })
    }

    parseMention(mention, guild) {
        let match = mention.match(/<@!?(\d+)>/)
        if (!match) return undefined
        if (guild === undefined) {
            return this.users.get(match[1])
        } else {
            return guild.members.get(match[1])
        }
    }

    parseUser(str, guild) {
        let m = this.parseMention(str, guild)
        if (m) return m
        let thing = guild ? guild.members : this.users
        m = thing.get(str)
        if (m) return m
        m = thing.find(a => a.username === str)
        if (m) return m
        m = thing.find(a => `${a.username}#${a.discriminator}` === str)
        if (m) return m
        return undefined
    }

    isOwner(user) {
        return this.owners.includes(user.id)
    }
}

class Command {
    constructor(name, code, desc, perms = [], botPerms = [], owner = false, dmable = false, aliases = []) {
        this.name = name
        this.code = code
        this.description = desc
        this.perms = perms
        this.botPerms = botPerms
        this.ownerOnly = owner
        this.aliases = aliases
        this.canBeDM = dmable
    }

    able(member) {
        if (member.guild.ownerID === member.id) {
            return true; // since permission.has doesn't take in account guild ownership...
        }
        if (member.permission.has('administrator')) {
            return true;
        }
        return this.perms.every(i => member.permission.has(i));
    }

    botAble(me) {
        if (me.guild.ownerID === me.id) {
            return true; // since permission.has doesn't take in account guild ownership...
        }
        if (me.permission.has('administrator')) {
            return true;
        }
        return this.botPerms.every(i => me.permission.has(i));
    }
}

class Context {
    constructor(bot, msg, cmd, prefix) {
        this.author = msg.author
        this.channel = msg.channel
        this.guild = msg.channel.guild
        this.message = msg
        this.command = cmd
        this.prefix = prefix
        if (msg.channel.guild) {
            this.me = msg.channel.guild.members.get(bot.user.id);
            this.member = msg.member
            this.isDM = false
        } else {
            this.isDM = true
        }
        this.bot = bot
    }

    async send(content, file) {
        return await this.bot.createMessage(this.channel.id, content, file)
    }
}

module.exports = {Nxtbot, Command, Context}