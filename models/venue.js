const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const VenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    address: String,
    city: String,
    country: String,
    isSatellite: {
        type: Boolean,
        default: false,
    },
    isCellGroup: {
        type: Boolean,
        default: false
    },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

VenueSchema.plugin(mongoosePaginate);
const Venue = mongoose.model('Venue', VenueSchema);

module.exports = Venue;