const Command = require("../../structures/Command.js"),
moment = require("moment"),
Discord = require("discord.js");

class Userinfo extends Command {
    constructor (client) {
        super(client, {
            name: "userinfo",
            enabled: true,
            aliases: [ "ui" ],
            clientPermissions: [ "EMBED_LINKS" ],
            permLevel: 0
        });
    }

    async run (message, args, data) {

        // Fetch user and member
        let user = message.mentions.users.first() || await this.client.resolveUser(args[0]) || message.author;
        let member = await message.guild.members.fetch(user.id).catch(() => {});
        let memberData = member ? await this.client.findOrCreateGuildMember({ id: member.id, guildID: member.guild.id }) : null;

        let fields = message.language.userinfo.fields;

        moment.locale(data.guild.language.substr(0, 2));

        let creationDate = moment(user.createdAt, "YYYYMMDD").fromNow();
        let joinDate = moment(member.joinedAt, "YYYYMMDD").fromNow();

        let embed = new Discord.MessageEmbed()
        .setAuthor(message.language.userinfo.title(user), user.displayAvatarURL())
        .addField(fields.bot.title(), fields.bot.content(user), true)
        .addField(fields.createdAt.title(), creationDate.charAt(0).toUpperCase() + creationDate.substr(1, creationDate.length), true)
        .setColor(data.color)
        .setFooter(data.footer);
        
        if(member){
            let joinData = memberData.joinData || (memberData.invitedBy ? { type: "normal", invite: { inviter: memberData.invitedBy } } : { type: "unknown" } );
            let joinWay = fields.joinWay.unknown(user);
            if(joinData.type === "normal"){
                let inviter = await this.client.users.fetch(joinData.invite.inviter);
                joinWay = fields.joinWay.invite(inviter);
            } else if(joinData.type === "vanity"){
                joinWay = fields.joinWay.vanity();
            } else if(joinData.type === "oauth" || user.bot){
                joinWay = fields.joinWay.oauth();
            }
            let guild = await message.guild.fetch();
            let members = guild.members.array().sort((a,b) => a.joinedTimestamp - b.joinedTimestamp);
            let joinPos = members.map((u) => u.id).indexOf(member.id);
            let previous = members[joinPos - 1] ? members[joinPos - 1].user : null;
            let next = members[joinPos + 1] ? members[joinPos + 1].user : null;
            embed.addField(fields.joinedAt.title(), joinDate.charAt(0).toUpperCase() + joinDate.substr(1, joinDate.length), true)
            .addField(fields.invites.title(), fields.invites.content(memberData))
            .addField(fields.joinWay.title(), joinWay)
            .addField(fields.joinOrder.title(), fields.joinOrder.content(previous, next, user));
        }

        message.channel.send(embed);
    }

};

module.exports = Userinfo;