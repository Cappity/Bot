const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
const { botToken } = require('./config.json');
const { db, initializeFirebase } = require('./firebase-setup.js');
const { handleLoaCommand } = require('./command-handler.js');
const { handleModalSubmit } = require('./modal-handler.js');
const { handleReactionAdd } = require('./reaction-handler.js');

// --- Discord Client Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

// --- Global State ---
let firebaseUserId = null;

// --- Bot Ready Event ---
client.once(Events.ClientReady, async () => {
    try {
        // Initialize Firebase Auth
        firebaseUserId = await initializeFirebase();
        console.log(`Firebase is ready! Auth User ID: ${firebaseUserId}`);
        console.log(`Discord Bot is ready! Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error("Bot failed to start:", error);
    }
});

// --- Interaction (Slash Command & Modal) Handler ---
client.on(Events.InteractionCreate, async (interaction) => {
    if (!firebaseUserId) {
        console.warn("Firebase not ready, interaction ignored.");
        if (interaction.isRepliable()) {
            await interaction.reply({ content: 'Bot is still initializing, please try again in a moment.', ephemeral: true });
        }
        return;
    }

    try {
        if (interaction.isChatInputCommand()) {
            await handleLoaCommand(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction, db, client);
        }
    } catch (error) {
        console.error("Error handling interaction:", error);
    }
});

// --- Reaction Handler ---
client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (!firebaseUserId) {
        console.warn("Firebase not ready, reaction ignored.");
        return;
    }
    
    try {
        await handleReactionAdd(reaction, user, db, client);
    } catch (error) {
        console.error("Error handling reaction:", error);
    }
});

// --- Login to Discord ---
client.login(botToken);

