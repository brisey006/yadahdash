const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const MemberSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        index: true
    },
    bio: String,
    email: {
        type: String,
        validate: {
            validator: function(v) {
              return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        },
        unique: true,
        sparse: true
    },
    address: String,
    phoneNumber: String,
    image: {
        original: {
            type: String,
            default: '/assets/images/members/avatar_placeholder.jpg'
        },
        thumbnail: {
            type: String,
            default: '/assets/images/members/avatar_placeholder.jpg'
        },
    },
    gender: String,
    dateOfBirth: Date,
    country: String,
    skill: String,
    idNumber: {
        type: String,
        unique: true,
        sparse: true
    },
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