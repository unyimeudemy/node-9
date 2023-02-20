const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filteredObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const user = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: user.length,
//     data: {
//       user
//     }
//   });
// });

exports.updateUserData = catchAsync(async (req, res, next) => {
  //check if there is password info
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password password updates. Please use /updatePassword',
        400
      )
    );
  } else {
    // update user data
    const filteredBody = filteredObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  }
});

exports.deleteAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// exports.createUser = factory.createOne(User);
exports.createUser = (req, res, next) => {
  res.status(200).json({
    status: 'successful',
    message: 'check signup route'
  });

  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getAllUsers = factory.getAll(User);
