const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

/**
 * Handles the /loa slash command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleLoaCommand(interaction) {
    if (interaction.commandName !== 'loa') return;

    try {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('loaModal')
            .setTitle('Leave of Absence Request');

        // Create text inputs
        const startDateInput = new TextInputBuilder()
            .setCustomId('startDate')
            .setLabel('Start Date (e.g., DD-MM-YYYY)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('25-12-2025')
            .setRequired(true);

        const endDateInput = new TextInputBuilder()
            .setCustomId('endDate')
            .setLabel('End Date (e.g., DD-MM-YYYY)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('01-01-2026')
            .setRequired(true);

        const typeInput = new TextInputBuilder()
            .setCustomId('loaType')
            .setLabel('Type of Leave')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Vacation, Medical, Burnout, etc.')
            .setRequired(true);

        const notesInput = new TextInputBuilder()
            .setCustomId('notes')
            .setLabel('Notes')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Include anything you\'d like to explain.')
            .setRequired(false);

        // Add inputs to modal
        modal.addComponents(
            new ActionRowBuilder().addComponents(startDateInput),
            new ActionRowFailure().addComponents(endDateInput),
            new ActionRowBuilder().addComponents(typeInput),
            new ActionRowBuilder().addComponents(notesInput)
        );

        // Show the modal to the user
        await interaction.showModal(modal);

    } catch (error) {
        console.error("Error showing LOA modal:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'An error occurred while showing the form.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'An error occurred while showing the form.', ephemeral: true });
        }
    }
}

module.exports = {
    handleLoaCommand
};
