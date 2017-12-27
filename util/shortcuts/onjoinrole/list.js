const paginateResult = require("../../modules/paginateResults");

module.exports = (client, message, args) => {
    return new Promise(async(resolve, reject) => {
        try {
            const guildEntry = client.guildData.get(message.guild.id);
            guildEntry.onEvent.guildMemberAdd.onJoinRole = guildEntry.onEvent.guildMemberAdd.onJoinRole.filter(r => message.guild.roles.get(r)); //Filter deleted roles
            if (!guildEntry.onEvent.guildMemberAdd.onJoinRole[0]) return resolve(message.channel.createMessage(`:x: There is not any role set to be given to new members yet`));
            let roleList = guildEntry.onEvent.guildMemberAdd.onJoinRole.map(r => message.guild.roles.get(r).name);
            roleList = paginateResult(roleList, 5);
            let rolesFields = [];
            guildEntry.onEvent.guildMemberAdd.onJoinRole.forEach(role => { //Build roles fields
                let guildRole = message.guild.roles.get(role);
                let mentionable = guildRole.mentionable ? `:white_check_mark:` : `:x:`
                hoisted = guildRole.hoist ? `:white_check_mark:` : `:x:`;
                rolesFields.push([{
                    name: 'Name',
                    value: `${guildRole.name}`,
                    inline: true
                }, {
                    name: 'HEX Color',
                    value: `#${guildRole.color}`,
                    inline: true
                }, {
                    name: `Hoisted`,
                    value: `${hoisted}`,
                    inline: true
                }, {
                    name: 'Mentionable',
                    value: `${mentionable}`,
                    inline: true
                }]);
            });
            let listMessage = function(page, raw) {
                return {
                    embed: {
                        title: "List of roles given to new members",
                        description: "Here's the list of the roles given to new members\n" + (raw ? "```\n" + roleList[page][0].join(`\n`) + "```" : ""),
                        footer: {
                            text: `Showing page ${page + 1}/${raw ? roleList.length : rolesFields.length} | Time limit: 60 seconds`
                        },
                        fields: raw ? undefined : rolesFields[page],
                        color: raw ? 0x000 : parseInt(message.guild.roles.get(guildEntry.onEvent.guildMemberAdd.onJoinRole[page]).color)
                    }
                }
            }
            let raw = false;
            let page = 0;
            const sentListMessage = await message.channel.createMessage(listMessage(page));
            const reactions = ["◀", "▶", "🗒", "❌"];
            for (let i = 0; i < reactions.length; i++) await sentListMessage.addReaction(reactions[i]);
            const collector = await sentListMessage.createReactionCollector((r) => r.user.id === message.author.id);
            client.on("messageDelete", m => { if (m.id === sentListMessage.id) return resolve(true) });
            let timeout = setTimeout(() => {
                collector.stop("timeout")
            }, 60000);
            collector.on("collect", async(r) => {
                sentListMessage.removeReaction(r.emoji.name, r.user.id);
                clearTimeout(timeout);
                if (r.emoji.name === "◀") {
                    page = page === 0 ? (raw ? roleList.length - 1 : rolesFields.length - 1) : page - 1;
                    sentListMessage.edit(listMessage(page, raw));
                } else if (r.emoji.name === "▶") {
                    page = page !== (raw ? roleList.length - 1 : rolesFields.length - 1) ? page + 1 : 0;
                    sentListMessage.edit(listMessage(page, raw));
                } else if (r.emoji.name === "🗒") {
                    raw = raw ? false : true;
                    page = 0;
                    sentListMessage.edit(listMessage(page, raw))
                } else if (r.emoji.name === "❌") {
                    collector.stop("aborted");
                }
                timeout = setTimeout(() => {
                    collector.stop("timeout");
                }, 60000)
            });
            collector.on("end", (collected, reason) => {
                sentListMessage.delete();
                resolve(true);
            });
        } catch (err) {
            reject(err);
        }
    });
}