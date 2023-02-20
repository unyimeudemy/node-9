const catchAsync = require('./../utils/catchAsync');
const Review = require('./../models/reviewAModel');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find();

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  // allow nested route
  if (!req.body.tour) req.params.tour = req.params.tourId; //
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.createReviews = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getAllReviews = factory.getAll(Review);
