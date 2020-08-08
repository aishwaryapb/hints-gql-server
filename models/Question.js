const { model, Schema } = require('mongoose');

const questionSchema = new Schema({
    word: String,
    taboo: [String]
});

module.exports = model('Question', questionSchema);