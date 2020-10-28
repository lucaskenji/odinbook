const User = require('../models/User.js');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');


exports.getAllUsers = (req, res) => {
  User.find().lean().populate('friends')
  .then((users) => {
    if (users.length === 0) {
      return res.status(404).json({
        message: 'No users found.'
      });
    }
    
    res.json(users);
  })
  .catch((err) => {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: err
    });
  });
}


exports.getUserWithId = (req, res) => {
  User.findById(req.params.userid)
  .then((user) => {
    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      })
    }
    
    res.json(user);
  })
  .catch((err) => {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: err
    })
  })
}


exports.registerValidation = [
  body('firstName').not().isEmpty().withMessage('You must provide your first name.').trim(),
  body('lastName').not().isEmpty().withMessage('You must provide your last name.').trim(),
  body('email').not().isEmpty().withMessage('You must provide an email.'),
  body('email').isEmail().withMessage('The email provided is invalid.').trim(),
  body('password').not().isEmpty().withMessage('You must provide a password.').trim(),
  body('birthDate').not().isEmpty().withMessage('You must provide a valid birth date.').trim(),
  body('gender').not().isEmpty().withMessage('You must provide your gender.').trim()
];


exports.userValidation = (req, res, next) => {
  const errors = validationResult(req);
      
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Bad request.',
      details: errors.array({ onlyFirstError: true })
    });
  }
  
  User.findOne({ email: req.body.email })
  .then((user) => {
    if (user && typeof req.params.userid === 'undefined') {   
      return res.status(400).json({
        message: 'Bad request.',
        details: ['The email provided is already in use.']
      });
    }
    
    if (user && user._id !== req.params.userid) {
      return res.status(400).json({
        message: 'Bad request.',
        details: ['The email provided is already in use.']
      });
    }
    
    next();
  })
  .catch((err) => {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: err
    })
  })
}


exports.createUser = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      birthDate: req.body.birthDate,
      gender: req.body.gender,
      friends: []
    });
    
    const newDocument = await newUser.save();
    
    return res.json(newDocument);
  } catch (err) {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: err
    });  
  }
}


exports.updateValidation = [
  body('firstName').optional().not().isEmpty().withMessage('First name not provided').trim(),
  body('lastName').optional().not().isEmpty().withMessage('Last name not provided').trim(),
  body('email').optional().not().isEmpty().withMessage('E-mail not provided').trim(),
  body('password').optional().not().isEmpty().withMessage('Password not provided').trim(),
  body('birthDate').optional().not().isEmpty().withMessage('Birth date not provided').trim(),
  body('gender').optional().not().isEmpty().withMessage('Gender not provided').trim()
];


exports.updateUser = async (req, res) => {
  let hashedPassword = '';
  
  if (req.body.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = bcrypt.hash(req.body.password, salt);
    } catch (err) {
      res.status(500).json({
        message: 'An internal error occurred.',
        details: err
      });  
    }
  }
  
  const updatedData = {...req.body};
  
  if (req.body.password) {
    delete updatedData.password;
    updatedData.password = hashedPassword;
  }
  
  const updateResult = await User.updateOne({_id: req.params.userid}, updatedData );
  
  if (updateResult.nModified === 1) {
    return res.json({ ...updatedData, _id: req.params.userid });
  } else {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: ['Update result did not return 1.']
    });
  }
}


exports.deleteUser = async (req, res) => {  
  const deleteResult = await User.deleteOne({ _id: req.params.userid });
  
  if (deleteResult.deletedCount === 1) {
    return res.json({ _id: req.params.userid });
  } else {
    res.status(500).json({
      message: 'An internal error occurred.',
      details: ['Deleted count did not return 1.']
    });
  }
}