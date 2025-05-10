const express = require('express');
const router = express.Router();
const RegistrationForm = require('../models/registrationFormModel');

// Create a new registration form
router.post('/', async (req, res) => {
  try {
    const { event, fields, createdBy } = req.body;
    const newForm = new RegistrationForm({ event, fields, createdBy });
    await newForm.save();
    res.status(201).json(newForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all registration forms
router.get('/', async (req, res) => {
  try {
    const forms = await RegistrationForm.find().populate('event').populate('createdBy');
    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific registration form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await RegistrationForm.findById(req.params.id).populate('event').populate('createdBy');
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a registration form
router.put('/:id', async (req, res) => {
  try {
    const updatedForm = await RegistrationForm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a registration form
router.delete('/:id', async (req, res) => {
  try {
    const deletedForm = await RegistrationForm.findByIdAndDelete(req.params.id);
    if (!deletedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;