const { withFilter } = require('apollo-server');
const Game = require('../models/Game');

const CURRENT_PLAYER = "CURRENT_PLAYER";
const END_GAME = "END_GAME";

module.exports = {
    Query: {
        async getGame(_, { gameId }) {
            let game = null;
            if(gameId) game = await Game.findById(gameId);
            return game;
        }
    },
    Mutation: {
        async createGame(_, { name }) {
            if (name.trim() === '') throw new Error('Name cannot be empty')
            const newGame = new Game({
                player1: {
                    name,
                    score: 0
                },
                player2: {
                    name: null,
                    score: null
                },
                currentPlayer: null
            });
            const game = await newGame.save();
            return game;
        },
        async updateGame(_, { name, gameId }, { pubsub }) {
            if (name.trim() === '') throw new Error('Name cannot be empty')
            const game = await Game.findById(gameId);
            game.player2 = { name, score: 0 };
            game.currentPlayer = 0;
            await game.save();
            pubsub.publish(CURRENT_PLAYER, {
                getCurrentPlayer: game
            });
            return game;
        },
        async updateScore(_, { correctGuess, gameId }, { pubsub }) {
            const game = await Game.findById(gameId);
            game.currentPlayer = !game.currentPlayer;
            if (correctGuess) game['player' + (game.currentPlayer + 1)].score += 1;
            await game.save();
            pubsub.publish(CURRENT_PLAYER, {
                getCurrentPlayer: game
            });
            return game;
        },
        async endGame(_, { gameId }, { pubsub }) {
            const game = await Game.findById(gameId);
            await game.delete();
            pubsub.publish(END_GAME, { endGame: gameId });
            return "Game over";
        }
    },
    Subscription: {
        getCurrentPlayer: {
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(CURRENT_PLAYER),
                (payload, variables) => payload.getCurrentPlayer.id === variables.gameId
            )
        },
        endGame: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(END_GAME)
        }
    }
}