/*global i18n, _, moment*/
"use strict";
//Filename: helpers/validators.js
//Dependency gestion depending on the fact that we are in the browser or in node.
var DependencyException = require("./custom_exception").DependencyException;
//All regex use in the application.
var regex = {
  email: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  number: /^-?\d+(?:\.d*)?(?:e[+\-]?\d+)?$/i
};

//Function to test an email.
function emailValidation(emailToValidate, options) {
  options = options || {};
  return regex.email.test(emailToValidate);
}
//Function to validate a date.
function dateValidation(dateToValidate, options) {
  return moment(dateToValidate).isValid();
}

//Function to test the length of a string.
function stringLength(stringToTest, options) {
  if ('string' !== typeof stringToTest) {
    return false;
  }
  options = options || {};
  //console.log(options);
  options.minLength = options.minLength || 0;
  var isMinLength = options.minLength !== undefined ? stringToTest.length >= options.minLength : true;
  var isMaxLength = options.maxLength !== undefined ? stringToTest.length <= options.maxLength : true;
  return isMinLength && isMaxLength;
}
//Function to  validate that an input is a number.
function numberValidation(numberToValidate, options) {
  options = options || {};
  if (!numberToValidate) {
    return true;
  }
  if (isNaN(numberToValidate)) {
    return false;
  }
  numberToValidate = +numberToValidate; //Cast it into a number.
  var isMin = options.min !== undefined ? numberToValidate >= options.min : true;
  var isMax = options.max !== undefined ? numberToValidate <= options.max : true;
  return isMin && isMax;
}

//Validate a property, a property shoul be as follow: `{name: "field_name",value: "field_value", validators: [{...}] }`
var validate = function validate(property, validators) {
  //console.log("validate", property, validators);
  var errors, res, validator, _i, _len;
  errors = [];
  if (validators) {
    for (_i = 0, _len = validators.length; _i < _len; _i++) {
      validator = validators[_i];
      res = validateProperty(property, validator);
      if (res !== null && res !== undefined) {
        errors.push(res);
      }
    }
  }
  return {
    name: property.name,
    value: property.value,
    isValid: errors.length === 0,
    errors: errors
  };
};

var validateProperty = function validateProperty(property, validator) {
  var isValid;
  if (!validator) {
    return void 0;
  }
  if (!property) {
    return void 0;
  }
  isValid = (function () {
    switch (validator.type) {
      case "required":
        var prevalidString = property.value === "" ? false : true;
        var prevalidDate = true;
        return validator.value === true ? (property.value !== null && property.value !== undefined && prevalidString && prevalidDate) : true;
      case "regex":
        if (property.value === undefined || property.value === null) {
          return true;
        }
        return validator.value.test(property.value);
      case "email":
        if (property.value === undefined || property.value === null) {
          return true;
        }
        return emailValidation(property.value, validator.options);
      case "number":
        return numberValidation(property.value, validator.options);
      case "string":
        var stringToValidate = property.value || "";
        return stringLength(stringToValidate, validator.options);
      case "date":
        return dateValidation(property.value, validator.options);
      case "function":
        return validator.value(property.value, validator.options);
      default:
        return void 0;
    }
  })();
  if (isValid === undefined || isValid === null) {
    console.warn('The validator of type: ' + validator.type + ' is not defined'); //Todo: call the logger.
  } else if (isValid === false) {

    //Add the name of the property.
    return getErrorLalel(validator.type, property.modelName + '.' + property.name, validator.options); //"The property " + property.name + " is invalid.";
  }
};

function getErrorLalel(type, fieldName, options) {
  options = options || {};
  if (!i18n) {
    throw new DependencyException("Dependency not resolved: i18n.js");
  }
  var translationKey = options.translationKey ? options.translationKey : "domain.validation." + type;
  var opts = _.extend({fieldName: i18n.t(fieldName)}, options);
  return i18n.translate(translationKey, opts);
  /*var message = (function() {
   switch (type) {
   case "required":
   return i18n.translate();
   case "regex":
   return validator.value.test(property.value);
   case "email":
   return emailValidation(property.value, validator.options);
   case "number":
   return numberValidation(property.value, validator.options);
   case "string":
   return stringLength(property.value, validator.options);
   case "function":
   return validator.value(property.value, validator.options);
   default:
   return void 0;
   }
   })();*/
}

// Validations functions.
var validators = {
  email: emailValidation,
  stringLength: stringLength,
  number: numberValidation,
  validate: validate
};

module.exports = validators;