module.exports = {
    name: 'link',
    description: 'Manages and views links.',
    code: async (ctx, args) => {
        let hasPerm = u => ctx.bot.isOwner(u) || u.permission.has('manageGuild')
        if (args[0] === 'add' && hasPerm(ctx.member)) {
            if (!args[1]) return await ctx.send(`Syntax: \`${ctx.prefix}${ctx.command.name} add <link name> <contents>\``)
            if (await ctx.bot.db[ctx.guild.id].tags[args[1]].exists) return await ctx.send('This link already exists.')
            await ctx.bot.db[ctx.guild.id].tags[args[1]].set(args.slice(1, args.length))
            return await ctx.send('Link added.')
        }
        if (args[0] === 'rm' && hasPerm(ctx.member)) {
            if (!args[1]) return await ctx.send(`Syntax: \`${ctx.prefix}${ctx.command.name} rm <link name>\``)
            if (!(await ctx.bot.db[ctx.guild.id].tags[args[1]].exists)) return await ctx.send('This link doesn\'t exist.')
            await ctx.bot.db[ctx.guild.id].tags[args[1]].delete
            return await ctx.send('Link added.')
        }
        if (!args[0]) return await ctx.send(`Syntax: \`${ctx.prefix}${ctx.command.name} <link name>\``)
        if (!(await ctx.bot.db[ctx.guild.id].tags[args[0]].exists)) return await ctx.send('This link doesn\'t exist.')
        let link = await ctx.bot.db[ctx.guild.id].tags[args[0]].get
        await ctx.send(link)
    },
    aliases: ['l']
}