const superagent = require('superagent');

module.exports = {
    name: 'dffd',
    description: 'Gathers information from the Dwarf Fortress File Depot.',
    code: async (ctx, args) => {
        if (!args[0]) {
            await ctx.send(`Usage: \`${ctx.prefix}dffd <file ID>\``)
        }
        let id = parseInt(args[0])
        if (id.isNaN) {
            await ctx.send(`Usage: \`${ctx.prefix}dffd <file ID>\``)
        }
        superagent.get(`http://dffd.bay12games.com/file_data/${id}.json`)
            .then(res => {
                if (res.status === 404) {
                    return ctx.send('Bad file ID. (404 Not Found)')
                }
                if (res.headers['content-type'] !== 'application/json') {
                    return ctx.send('Oops, something went wrong on DFFD\'s side. This is not your fault, nor is it the bot\'s. Try again later maybe?')
                }
                ctx.send({
                    embed: {
                        title: res.body.filename,
                        url: `http://dffd.bay12games.com/file.php?id=${id}`,
                        description: `by ${res.body.author}`,
                        fields: [
                            {
                                name: 'Version',
                                value: `${res.body.version} (for DF ${res.body.version_df})`,
                                inline: false
                            },
                            {
                                name: 'Rating',
                                value: `${res.body.rating} stars (based on ${res.body.votes} votes)`,
                                inline: false
                            }
                        ],
                        footer: {
                            text: `Last updated on ${res.body.updated_date}`
                        },
                        color: Math.floor(Math.random() * 0xFFFFFF)
                    }
                })
            })
    },
    aliases: ['depot']
}