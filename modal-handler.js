const { doc, setDoc } = require('firebase/firestore');
const { createLoaEmbed } = require('./utils.js');
const { LOA_COLLECTION } = require('./firebase-setup.js');
const { reviewChannelId } = require('./config.json');

/**
 * Handles the submission of the loaModal.
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {import('firebase/firestore').Firestore} db
 * @param {import('discord.js').Client} client
 */
async function handleModalSubmit(interaction, db, client) {
    if (interaction.customId !== 'loaModal') return;

    await interaction.deferReply({ ephemeral: true });

    try {
        const startDate = interaction.fields.getTextInputValue('startDate');
        const endDate = interaction.fields.getTextInputValue('endDate');
        const loaType = interaction.fields.getTextInputValue('loaType');
        const notes = interaction.fields.getTextInputValue('notes') || 'N/A';
        const user = interaction.user;

        const requestData = {
            userId: user.id,
            username: user.globalName || user.username,
            userAvatar: user.displayAvatarURL(),
            user: { // Store user info for the embed
                id: user.id,
                username: user.username,
                globalName: user.globalName,
                displayAvatarURL: () => user.displayAvatarURL()
            },
            startDate,
            endDate,
            loaType,
            notes,
            status: 'Pending',
            submittedAt: new Date().toISOString()
        };

        // Find the review channel
        const reviewChannel = await client.channels.fetch(reviewChannelId);
        if (!reviewChannel) {
            console.error("Review channel not found!");
            return interaction.editReply({ content: 'Error: Bot configuration is incorrect. Please contact an admin.' });
        }

        // Create and send the initial "Pending" embed
        const embed = createLoaEmbed(requestData, 'Pending');
        const reviewMessage = await reviewChannel.send({ embeds: [embed] });

        // Add reactions for admins
        await reviewMessage.react('✅');
        await reviewMessage.react('❌');
        await reviewMessage.react('🤔');

        // Save to Firestore using the Review Message ID as the document ID
        const docRef = doc(db, LOA_COLLECTION, reviewMessage.id);
        await setDoc(docRef, { ...requestData, reviewMessageId: reviewMessage.id });

        // Confirm to the user
        await interaction.editReply({ content: 'Your LOA request has been submitted successfully and is pending review.' });

    } catch (error) {
        console.error('Error handling modal submission:', error);
        await interaction.editReply({ content: 'An error occurred while submitting your request. Please try again later.' });
    }
}

module.exports = {
    handleModalSubmit
};
