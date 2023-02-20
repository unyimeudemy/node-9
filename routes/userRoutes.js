const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const factory = require('./../controllers/handlerFactory');

const router = express.Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//protect all routes after this middleware
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/updatePassword', authController.updatePassword);

router.patch('/updateUserData', userController.updateUserData);

router.delete('/deleteAccount', userController.deleteAccount);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
