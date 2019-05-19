const superagent = require('superagent');

// the DF Wiki API is at http://dwarffortresswiki.org/api.php
const apiEndpoint = 'http://dwarffortresswiki.org/api.php';

module.exports = {
    name: 'dfwiki',
    description: 'Searches the Dwarf Fortress Wiki for info.',
    code: async (ctx, args) => {
        let sanitised = args.filter(a => a !== '--outdated').join(' ')
        let toSearch = encodeURIComponent(sanitised)
        let outdated = args.includes('--outdated')
        let baseURL = `${apiEndpoint}?action=opensearch&search=${toSearch}&format=json`
        superagent.get(baseURL)
            .then(res => {
                let fields = res.body[1].slice(0, 10).filter(a => {
                    if (outdated) {
                        return true
                    }
                    return a.split(':')[0] === 'DF2014' || !a.includes(':')
                }).map(a => {
                    return `[${a}](http://dwarffortresswiki.org/index.php/${encodeURI(a)})`
                })
                ctx.send({
                    embed: {
                        title: `DFWiki search results for ${sanitised}`,
                        description: fields.join('\n') || 'No results.',
                        color: Math.floor(Math.random() * 0xFFFFFF),
                        footer: {
                            text: 'Specify `--outdated` in the query to get pre-DF2014 information.'
                        }
                    }
                })
            })
            .catch(e => {
                console.log(e);
                ctx.send('Oops, some kind of error has occurred during wiki search. Please tell the dev. I will also auto-restart to attempt to fix the bug.')
                    .then(() => process.exit(1));
            })
    },
    aliases: ['wiki', 'w']
}