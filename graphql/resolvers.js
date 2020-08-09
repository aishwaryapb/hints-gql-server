const { withFilter, ApolloError } = require('apollo-server');
const { Game, Question } = require('../models');

const CURRENT_PLAYER = "CURRENT_PLAYER";
const END_GAME = "END_GAME";

module.exports = {
    Query: {
        async getGame(_, { gameId }) {
            let game = null;
            if (gameId) game = await Game.findById(gameId);
            return game;
        },
        async getQuestion() {
            let question = null;
            question = await Question.aggregate([{ $sample: { size: 1 } }, { $project: { id: "$_id", _id: 0, word: 1, taboo: 1 } }]);
            return question[0];
        }
    },
    Mutation: {
        async createGame(_, { name }) {
            if (name.trim() === '') throw new ApolloError('Name cannot be empty')
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
            if (name.trim() === '') throw new ApolloError('Name cannot be empty')
            const game = await Game.findById(gameId);
            if (game.currentPlayer !== null) throw new ApolloError("Game already in progress");
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
            const result = game.player1.score > game.player2.score ? `${game.player1.name} Wins! 🥳` : game.player1.score === game.player2.score ? "It's a draw! 🤝" : `${game.player2.name} Wins 🥳`;
            await game.delete();
            pubsub.publish(END_GAME, { endGame: { result, id: gameId } });
            return result;
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
            subscribe: withFilter(
                (_, __, { pubsub }) => pubsub.asyncIterator(END_GAME),
                (payload, variables) => payload.endGame.id === variables.gameId
            )
        }
    }
}