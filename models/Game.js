const { model, Schema } = require('mongoose');

const gameSchema = new Schema({
    player1: {
        name: String,
        score: Number
    },
    player2: {
        name: String,
        score: Number
    },
    currentPlayer: Number
});

module.exports = model('Game', gameSchema);