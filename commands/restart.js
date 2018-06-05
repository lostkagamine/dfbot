module.exports = {
    name: 'restart',
    description: 'Restarts dfbot. Owner-only.',
    dmable: true,
    code: async (ctx, args) => {
        await ctx.send('dfbot is now restarting...')
        process.exit(0)
    },
    ownerOnly: true,
    aliases: ['die', 'reboot', 'kys']
}