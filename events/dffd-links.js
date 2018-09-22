const superagent = require('superagent');

module.exports = {
    events: ['messageCreate'],
    code: m => {
        let dfre = /http:\/\/dffd.bay12games.com\/file.php\?id=(.*)+/
        if (m.author.bot) return; // prevent the bot from looping in on itself
        if (dfre.test(m.content)) {
            let id = dfre.exec(m.content)[1]
            // we got the ID
            superagent.get(`http://dffd.bay12games.com/file_data/${id}.json`)
                .then(res => {
                    if (res.status === 404) {
                        return
                    }
                    if (res.headers['content-type'] !== 'application/json') {
                        return
                    }
                    m._client.createMessage(m.channel.id, {
                        embed: {
                            title: res.body.filename,
                            url: `http://dffd.bay12games.com/file.php?id=${id}`,
                            description: `by ${res.body.author}`,
                            author: {
                                name: 'Dwarf Fortress File Depot'
                            },
                            fields: [
                                {
                                    name: 'Version',
                                    value: `${res.body.version || 'Unspecified'}${res.body.version_df ? ` (for DF version ${res.body.version_df})` : ''}`,
                                    inline: false
                                },
                                {
                                    name: 'Rating',
                                    value: `${res.body.rating} stars${res.body.votes > 0 ? ` (based on ${res.body.votes} votes)` : ''}`,
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
                .catch(e => { m._client.createMessage(m.channel.id, 'Error has occurred while searching DFFD: `' + e + '`') })
        }
    }
}