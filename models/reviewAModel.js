const mongoose = require('mongoose');
const user = require('./userModel');
const slugify = require('slugify');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    created: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a tour']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'tour',
  //     select: ['name', 'address', 'duration']
  //   }).populate({
  //     path: 'user',
  //     select: ['name', 'photo']
  //   });

  this.populate({
    path: 'user',
    select: ['name', 'photo']
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
