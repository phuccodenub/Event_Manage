const RegistrationForm = require('../models/registrationFormModel');
const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');

exports.getEventForm = async (req, res, next) => {
  try {
    const form = await RegistrationForm.findOne({ event: req.params.eventId });
    if (!form) {
      return next(new ErrorResponse('Form not found', 404));
    }

    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEventForm = async (req, res, next) => {
  try {
    const { fields } = req.body;
    let form = await RegistrationForm.findOne({ event: req.params.eventId });

    if (!form) {
      form = await RegistrationForm.create({
        event: req.params.eventId,
        fields,
        createdBy: req.user.id
      });
    } else {
      form.fields = fields;
      await form.save();
    }

    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    next(error);
  }
};

exports.submitFormResponse = async (req, res, next) => {
  try {
    const { responses } = req.body;
    const formResponse = await FormResponse.create({
      form: req.params.formId,
      user: req.user.id,
      responses
    });

    res.status(201).json({
      success: true,
      data: formResponse
    });
  } catch (error) {
    next(error);
  }
};

exports.getFormResponses = async (req, res, next) => {
  try {
    const responses = await FormResponse.find({ form: req.params.formId })
      .populate('user');

    res.status(200).json({
      success: true,
      data: responses
    });
  } catch (error) {
    next(error);
  }
};
