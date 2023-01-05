const jwt = require('jsonwebtoken');
const Tour = require('./../models/tourModel');
// const { promisify } = require('util');
const util = require('util');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = IDD => {
  return jwt.sign({ id: IDD }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'successful',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(email, password)

  if (!email || !password) {
    return next(new AppError('please provide a valid email and password', 400));
  } else {
    //check if we have such password and email in our database
    // const user = await User.findOne({ email: req.body.email }).select(
    const user = await User.findOne({ email }).select('+password');
    // console.log(password);
    // console.log(user.password);

    // if (!user || !(await user.correctPassword(password, user.password))) {
    if (!user) {
      return next(new AppError('incorrect email or password', 401));
    } else {
      //send the token
      const token = signToken(user._id);
      res.status(400).json({
        status: 'success',
        token
      });
    }
  }
});

// || !(await user.correctPassword(password, user.password))

exports.protect = catchAsync(async (req, res, next) => {
  //getting the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('you are not logged in. Please log in to get access', 401)
    );
  }

  //verifying token
  // jwt.verify(token, process.env.JWT_SECRET); ****** the normal usage
  const thePromise = util.promisify(jwt.verify);
  const decoded = await thePromise(token, process.env.JWT_SECRET);
  console.log(decoded.id); // part of the payload

  //check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('the user that has the token no longer exist', 401)
    );
  }

  //check if user changed password after token was issued
  // if (false) {
  if ((await currentUser.changePasswordAfter(decoded.iat)) === true) {
    return next(
      new AppError('password recently changed. Please login again', 401)
    );
  }

  // next() means the user should be granted access to the  protected route
  req.user = currentUser;
  next();
});
