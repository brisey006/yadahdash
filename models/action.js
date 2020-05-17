const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ActionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    affectedId: mongoose.Schema.Types.ObjectId,
    action: {
        type: String,
        required: true,
        index: true
    },
    model: String,
    data: String,
    updated: String
}, {
    timestamps: true
});

ActionSchema.plugin(mongoosePaginate);
const Action = mongoose.model('Action', ActionSchema);

module.exports = Action;