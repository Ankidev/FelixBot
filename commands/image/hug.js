class Hug {
    constructor() {
        this.help = {
            name: 'hug',
            description: 'hug someone',
            usage: 'hug [user_resolvable]'
        };
        this.conf = {
            require: "wolkeImageKey"
        }
    }

    run(client, message, args) {
        return new Promise(async(resolve, reject) => {
            const request = require("../../util/modules/request.js");
            try {
                let result = await request.get("https://api.weeb.sh/images/random?type=hug&filetype=gif", { header: 'Authorization', value: `Bearer ${client.config.wolkeImageKey}` });
                let users = message.guild ? await message.getUserResolvable() : {};
                if (!result.body || !result.body.url) return resolve(await message.channel.createMessage(":x: An error occurred :v"));
                resolve(await message.channel.createMessage({
                    embed: {
                        description: users.first && users.first() ? `Hey ${users.map(u => '**' + u.tag + '**').join(", ")}, you just received a hug from **${message.author.tag}**` : "",
                        image: {
                            url: result.body.url
                        },
                        footer: {
                            text: `Powered by https://weeb.sh/`
                        }
                    }
                }));
            } catch (err) {
                reject(err, message);
            }
        });
    }
}

module.exports = new Hug();