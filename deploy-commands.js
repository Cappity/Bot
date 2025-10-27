const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { clientId, guildId, botToken } = require('./config.json');

// Define the slash command
const loaCommand = new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Submit a Leave of Absence (LOA) or inactivity notice.');

const commands = [loaCommand.toJSON()];

// Initialize the REST module
const rest = new REST({ version: '10' }).setToken(botToken);

// Deploy the commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

