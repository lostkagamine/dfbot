module.exports = {
    name: 'about',
    description: 'About me.',
    code: async (ctx, args) => {
        await ctx.send({
            embed: {
                title: 'About me',
                description: 'Hi, I\'m dfbot! I was made in Node.js by ry00001.\nI currently use the Eris library.',
                fields: [
                    {
                        name: 'Node.js version',
                        value: `${process.versions.node} (v8 v${process.versions.v8})`,
                        inline: false
                    },
                    {
                        name: 'Debug info',
                        value: `Loaded commands: ${ctx.bot.commands.length}\nLoaded events: ${ctx.bot.events.length}`,
                        inline: false
                    }
                ]
            }
        })
    }
}