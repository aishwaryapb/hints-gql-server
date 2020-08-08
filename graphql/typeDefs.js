const { gql } = require('apollo-server');

module.exports = gql`

    type Player {
        name: String
        score: Int
    }

    type Game {
        id: ID!
        player1: Player!
        player2: Player!
        currentPlayer: Int
    }

    type GameOver {
        id: ID!
        result: String!
    }

    type Question {
        id: ID!
        word: String!
        taboo: [String!]
    }

    type Query {
        getGame(gameId: String!): Game
        getQuestion: Question!
    }

    type Mutation {
        createGame(name: String!): Game!
        updateGame(name: String!, gameId: String!): Game!
        updateScore(correctGuess: Boolean!, gameId: String!): Game!
        endGame(gameId: String!): String!
    }

    type Subscription {
        getCurrentPlayer(gameId: String!): Game!
        endGame(gameId: String!): GameOver!
    }
`;