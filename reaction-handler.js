const { getDoc, doc, updateDoc } = require('firebase/firestore');
const { PermissionsBitField } = require('discord.js');
const { createLoaEmbed } = require('./utils.js');
const { LOA_COLLECTION } = require('./firebase-setup.js');
const { reviewChannelId, archiveChannelId } = require('./config.json');

/**
 * Handles an admin reaction on an LOA request.
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {import('firebase/firestore').Firestore} db
 * @param {import('discord.js').Client} client
 */
async function handleReactionAdd(reaction, user, db, client) {
    // 1. Check for valid reaction
    if (user.bot) return; // Ignore bots
    if (!reaction.message.guild) return; // Ignore DMs
    if (reaction.message.channel.id !== reviewChannelId) return; // Ignore other channels

    const validReactions = ['✅', '❌', '🤔'];
    if (!validReactions.includes(reaction.emoji.name)) return;

    // 2. Check admin permissions
    const member = await reaction.message.guild.members.fetch(user.id);
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        // User is not an admin, remove their reaction
        try {
            await reaction.users.remove(user.id);
        } catch (error) {
            console.warn("Failed to remove unauthorized reaction:", error.code);
        }
        return;
    }

    // 3. Process the reaction
    try {
        // Fetch full message and reaction data if they are partial
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const message = reaction.message;
        const messageId = message.id;
        const docRef = doc(db, LOA_COLLECTION, messageId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.warn(`No LOA document found for message ID: ${messageId}`);
            return;
        }

        const requestData = docSnap.data();
        let newStatus = requestData.status;
        let dmMessage = '';
        let statusChanged = false;

        // --- Determine new status ---
        switch (reaction.emoji.name) {
            case '✅':
                if (requestData.status !== 'Approved') {
                    newStatus = 'Approved';
                    dmMessage = `Your LOA request for **${requestData.startDate}** to **${requestData.endDate}** has been **Approved**.`;
                    statusChanged = true;
                }
                break;
            case '❌':
                if (requestData.status !== 'Denied') {
                    newStatus = 'Denied';
                    dmMessage = `Your LOA request for **${requestData.startDate}** to **${requestData.endDate}** has been **Denied**.`;
                    statusChanged = true;
                }
                break;
            case '🤔':
                if (requestData.status !== 'Reconsidering') {
                    newStatus = 'Reconsidering';
                    dmMessage = `An admin is **reconsidering** your LOA request for **${requestData.startDate}** to **${requestData.endDate}**. They may contact you for more details.`;
                    statusChanged = true;
                }
                break;
        }

        if (!statusChanged) {
            // Admin re-clicked the same reaction. Remove it to prevent clutter.
            await reaction.users.remove(user.id);
            return;
        }
        
        console.log(`Processing ${reaction.emoji.name} for message ${messageId} by ${user.tag}`);

        // --- Update database ---
        const adminInfo = {
            id: user.id,
            username: user.username,
            globalName: user.globalName
        };
        await updateDoc(docRef, {
            status: newStatus,
            processedBy: user.id,
            processedAt: new Date().toISOString(),
            adminInfo: adminInfo
        });

        // --- Update original embed ---
        // We need to re-fetch the user object for the embed
        const originalUser = await client.users.fetch(requestData.userId);
        const embedData = {
            ...requestData,
            user: { // Re-construct the user object for the embed function
                id: originalUser.id,
                username: originalUser.username,
                globalName: originalUser.globalName,
                displayAvatarURL: () => originalUser.displayAvatarURL()
            },
            admin: user // Pass the admin user who reacted
        };
        const updatedEmbed = createLoaEmbed(embedData, newStatus);
        await message.edit({ embeds: [updatedEmbed] });

        // --- Send DM to user ---
        try {
            const requestUser = await client.users.fetch(requestData.userId);
            if (requestUser) {
                await requestUser.send(dmMessage);
            }
        } catch (dmError) {
            console.warn(`Failed to DM user ${requestData.userId}:`, dmError.message);
        }

        // --- Post to archive channel (if not 'Reconsidering') ---
        if (newStatus === 'Approved' || newStatus === 'Denied') {
            try {
                const archiveChannel = await client.channels.fetch(archiveChannelId);
                if (archiveChannel) {
                    await archiveChannel.send({ embeds: [updatedEmbed] });
                }
            } catch (archiveError) {
                console.error("Failed to post to archive channel:", archiveError);
            }
        }
        
        // --- Clean up reactions ---
        await message.reactions.removeAll();

    } catch (error) {
        console.error('Error processing reaction:', error);
    }
}

module.exports = {
    handleReactionAdd
};
