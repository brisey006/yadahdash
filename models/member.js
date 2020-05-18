const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const MemberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    partner: {
        type: Boolean,
        default: false
    },
    cellGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    satellite: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    affiliation: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliation' }
}, {
    timestamps: true
});

MemberSchema.plugin(mongoosePaginate);
const Member = mongoose.model('Member', MemberSchema);

module.exports = Member;