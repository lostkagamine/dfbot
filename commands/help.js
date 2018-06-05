module.exports = {
    name: 'help',
    description: 'A command list',
    code: async (ctx, args) => {
        let o = '```dfbot command list\n'
        let end = `Commands can be called with \`${ctx.prefix}<command> [arguments]\``
        for (let i of ctx.bot.commands) {
            if (i.ownerOnly && !ctx.bot.isOwner(ctx.author)) continue;
            o += `${i.name}: ${i.description || 'No description, report this to the bot author!'}\n`
        }
        await ctx.send(o + '```' + end)
    }
}