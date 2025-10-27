const { EmbedBuilder } = require('discord.js');

/**
 * Creates an embed for an LOA request.
 * @param {object} data - The LOA request data.
 * @param {'Pending' | 'Approved' | 'Denied' | 'Reconsidering'} status - The status of the request.
 * @returns {EmbedBuilder}
 */
function createLoaEmbed(data, status) {
    const { user, startDate, endDate, loaType, notes } = data;
    const username = user.globalName || user.username;

    const statusMap = {
        Pending: { color: 0xFFD700, text: 'Pending Review' },
        Approved: { color: 0x00FF00, text: '✅ Approved' },
        Denied: { color: 0xFF0000, text: '❌ Denied' },
        Reconsidering: { color: 0xAAAAAA, text: '🤔 Reconsidering' },
    };

    const embed = new EmbedBuilder()
        .setTitle(`LOA Request: ${username}`)
        .setColor(statusMap[status].color)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: 'User', value: `<@${user.id}>`, inline: true },
            { name: 'Status', value: `**${statusMap[status].text}**`, inline: true },
            { name: 'Start Date', value: startDate, inline: false },
            { name: 'End Date', value: endDate, inline: true },
            { name: 'Type', value: loaType, inline: true },
            { name: 'Notes', value: notes || 'N/A' }
        )
        .setTimestamp();

    if (data.admin) {
        embed.setFooter({ text: `Processed by: ${data.admin.globalName || data.admin.username}` });
    }

    return embed;
}

module.exports = {
    createLoaEmbed
};
