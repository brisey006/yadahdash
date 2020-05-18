const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const AffiliationSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    acronym: {
        type: String
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

AffiliationSchema.plugin(mongoosePaginate);
const Affiliation = mongoose.model('Affiliation', AffiliationSchema);

module.exports = Affiliation;