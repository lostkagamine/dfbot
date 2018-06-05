const superagent = require('superagent');

// the DF Wiki API is at http://dwarffortresswiki.org/api.php
const apiEndpoint = 'http://dwarffortresswiki.org/api.php';

module.exports = {
    name: 'dfwiki',
    description: 'Searches the Dwarf Fortress Wiki for info.',
    code: async (ctx, args) => {
        let toSearch = encodeURIComponent(args.filter(a => a !== '--outdated').join(' '))
        let outdated = args.includes('--outdated')
        let baseURL = `${apiEndpoint}?action=opensearch&search=${toSearch}&format=json`
        superagent.get(baseURL)
            .then(res => {
                let fields = res.body[1].slice(0, 5).filter(a => {
                    if (outdated) {
                        return true
                    }
                    return a.split(':')[0] === 'DF2014' || !a.includes(':')
                }).map(a => {
                    return `[${a}](http://dwarffortresswiki.org/index.php/${encodeURI(a)})`
                })
                ctx.send({
                    embed: {
                        title: `DFWiki search results for ${args.join(' ')}`,
                        description: fields.join('\n') || 'No results.',
                        color: Math.floor(Math.random() * 0xFFFFFF)
                    }
                })
            })
            .catch(e => {
                console.log(e);
                ctx.send('Oops, some kind of error has occurred during wiki search. Please tell the dev.')
            })
    }
}