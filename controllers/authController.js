const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Tour = require('./../models/tourModel');
// const { promisify } = require('util');
const util = require('util');
// const bcrypt

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = IDD => {
  return jwt.sign({ id: IDD }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'successful',
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  createAndSendToken(newUser, 201, res);
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

    if (!user || !(await user.correctPassword(password, user.password))) {
      // if (!user) {
      return next(new AppError('incorrect email or password', 401));
    } else {
      //send the token
      createAndSendToken(user, 400, res);
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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //role = [admin, lead-guide]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with such email', 404));
  }

  // 2) generate token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token back to email address
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your 
  new password and password confirm to: ${resetURL}. If you didn't forget 
  your password please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token. Valid for only 10 minutes',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    });
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'there was an error sending email, please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken
    // passwordResetExpire: { $gt: Date.now() }
  });

  //if there is user and the token is not expired, set the password
  if (!user) {
    return next(new AppError('token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  //update the changePasswordAt  property for the user model(this is done with a middleware)

  //log user in

  createAndSendToken(user, 400, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //   console.log(req.user);
  //   const user = await User.findOne({ email: req.body.email }).select(
  //     '+password'
  //   );
  const user = await User.findById(req.user.id).select('+password');

  console.log(req.user);

  // actually we should check if user exist and old password provided is correct as shown below
  // before allowing the user to change old password to new password. But this will not be done
  // here since our password comparison logic is not working. Thus we will proceed to changing
  // password once the user can be found in the database.

  if (
    !user ||
    !(await user.correctPassword(req.body.passwordOldConfirm, user.password))
  ) {
    // user.password = req.body.password;
    return next(new AppError('your current password is wrong', 401));
  }

  //   if (!user) {
  //     return next(new AppError('your current password is wrong', 401));
  //   }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save(); //

  console.log(user.password);

  createAndSendToken(user, 400, res);
});
