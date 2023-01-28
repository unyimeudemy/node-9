const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'input your user name']
  },
  email: {
    type: String,
    require: [true, 'input your email address'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    require: [true, 'please input your password'],
    minLenght: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    require: [true, 'please retype your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      }
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function(next) {
  //only run the function if password has been modified
  if (!this.isModified('password')) {
    return next();
  } else {
    //delete password confirm
    this.passwordConfirm = undefined;

    // hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  }
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  const passwordCheck = await bcrypt.compare(candidatePassword, userPassword);
  console.log('❤', candidatePassword);
  console.log('❤', userPassword);
  console.log(passwordCheck);
  return passwordCheck;
};

userSchema.methods.changePasswordAfter = async function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(JWTTimeStamp < changedTimeStamp);
    // console.log(JWTTimeStamp, changedTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  } else {
    //false means not changed
    return false;
  }
};

userSchema.methods.createPasswordResetToken = function() {
  //generating token
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpire = (Date.now() + 10) * 60 * 1000;

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
