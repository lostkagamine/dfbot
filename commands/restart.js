module.exports = {
    name: 'restart',
    description: 'Restarts dfbot. Owner-only.',
    dmable: true,
    code: async (ctx, args) => {
        await ctx.send('System going down for reboot NOW!')
        process.exit(0)
    },
    ownerOnly: true,
    aliases: ['die', 'reboot', 'kys']
}