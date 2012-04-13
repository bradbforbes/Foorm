var Foorm = function Foorm(formId, fieldData) {

    var that = this;

    /**
     * ---------------------------------------------------------
     * Private methods
     * ---------------------------------------------------------
     */

    /**
     * Creates and returns a comma-separated string of all of our
     * input field IDs that can be fed to jQuery as a selector.
     *
     * @return {string}
     */
    var extractFieldIdsString = function extractFieldIdsString() {
        string = '';
        for (var i in fields) {
            string += '#' + fields[i].name + ',';
        }
        return string.substr(0, string.length - 1);
    };

    /**
     * Returns the data object of a registered field.
     *
     * @param {string} fieldName
     * @return {bool}|{object}
     */
    var getFieldData = function getFieldData(fieldName) {
        for (var i in fields) {
            if (fields[i].name == fieldName)
                return fields[i];
        }
        return false;
    };

    /**
     * Activates a field by adding it to the list of active fields.
     *
     * @param {string} The unique id (name) of a registered field.
     */
    var activateField = function activateField(fieldId) {
        if (isFieldActive(fieldId) === false) {
            activeFields.push(fieldId);
        }
    };

    /**
     * Returns true if a field is in the active collections.
     *
     * @param {string} The unique id (name) of a registered field.
     */
    var isFieldActive = function isFieldActive(fieldId) {
        for (var i in activeFields) {
            if (activeFields[i] == fieldId) {
                return true;
            }
        }
        return false;
    };

    /**
     * Updates the values of all of our registered fields with both
     * Foorm and validator.js.
     */
    var updateFieldValues = function updateFieldValues() {

        // Update each of Foorm's field objects.
        for (var i in fields) {
            fields[i].value = $('#' + fields[i].name).val();
        }

        // Update each of validate.js's field objects.
        for (var i = 0, fieldLength = validator.fields.length; i < fieldLength; i++) {
            validator.fields[i].value = $('#' + validator.fields[i].name).val();
        }
    };

    /**
     * Sets the error for a field, including all visual changes.
     *
     * @param name
     * @param error
     */
    var setFieldError = function setFieldError(name, error) {
        var errorContainer = $('#field-error-' + name),
            errorElement = $(errorContainer).children();

        errorElement.html(error);
        positionErrorMessage(errorElement);
        errorElement.show();
    };

    /**
     * Empties out the HTML and hides a field's error message element.
     *
     * This can run even if the field has already been unset multiple times over,
     * but it is a bit inefficient running this jQuery, so caching the fields'
     * errors and doing a check that way would be more efficient.
     *
     * @param name
     */
    var unsetFieldError = function unsetFieldError(name) {
        $('#field-error-' + name).children().html('').hide();
    };

    /**
     * Positions an existing error message element neatly above
     * its relevant input element.
     *
     * @param element The error element to position
     */
    var positionErrorMessage = function positionErrorMessage(element) {
        var height = element.outerHeight(true);
        var newTop = (height * -1);
        element.css('top', newTop + 'px');
    }


    /* eo Private Methods
    --------------------------------------------------------- */


    /**
     * ---------------------------------------------------------
     * Private properties
     * ---------------------------------------------------------
     */

    /**
     * A single-dimensional array of field names that
     * have been activated by the user.
     *
     * This is ensure that we do not display errors
     * for fields that the user has not yet gotten to.
     */
    var activeFields = [];

    /**
     * Some JSON data that validate.js can work with to do
     * basic validation of all fields.
     *
     * Included properties:
     * - name       => The unique name of the field
     * - display    => The name of the field to display in error messages
     * - rules      => The rules string recognizable by validate.js
     * - value      => The current value of the field, provided by updateFieldValues()
     */
    var fields = fieldData;

    /**
     * A jQuery-tailored, comma-separated selector list of the
     * ids of all of our fields.
     */
    var fieldIdsString = extractFieldIdsString();
    console.log(fieldIdsString);

    /**
     * The array of HTMl elements provided by jQuery for our
     * comma-separated list of field ids.
     *
     * @param HTMLCollection
     */
    var fieldElements = $(fieldIdsString);
    console.log('Field Ids: ' + fieldIdsString);
    console.log('Fields');
    console.log(fieldElements);

    /**
     * An instance of validate.js's FormValidator object to do
     * the validation heavy-lifting for us.
     */
    var validator = new FormValidator(formId, fields, function(){});

    /**
     * The form element being validated.
     */
    var formElement = $('#' + formId);

    /* eo Private properties
    --------------------------------------------------------- */


    /**
     * ---------------------------------------------------------
     * Public methods
     * ---------------------------------------------------------
     */

    /**
     * Validates all active fields in the form.
     *
     * Visual errors are triggered individually for each field.
     *
     * Before any validation occurs, we update the stored field
     * values in both Foorm and validate.js so that any registered
     * validation callbacks that feature field-interdependencies
     * will have the most up-to-date data to validate with.
     *
     * validate.js's private method _validateField is
     * employed to validate each field individually.
     */
    this.validate = function validate() {
        var isValid = true,
            fieldName = '',
            fieldData,
            fieldError = false;

        // Update all of field values in the form before
        // doing any validation.
        updateFieldValues();

        // Validate each active field individually.
        for (var i in activeFields) {

            // Get the data for this field that we need in order to
            // validate it.
            fieldName = activeFields[i];
            fieldData = getFieldData(fieldName);

            // Empty any errors contained in validator.js
            validator.errors.length = 0;

            // Let validator.js validate the field.
            validator._validateField({
                name: fieldName,
                display: fieldData.display || fieldName,
                rules: fieldData.rules,
                type: null,
                value: fieldData.value,
                checked: null
            });

            // Handle the field error if there was one.
            if (validator.errors.length > 0) {

                // Mark the entire form as having errors.
                isValid = false;

                // Get the error string as reported by validate.js;
                fieldError = validator.errors[0];

                // Trigger the visual error in the form for the
                // errored field.
                setFieldError(fieldName, fieldError);
            }

            // Unset any existing errors that the user must have just
            // corrected if needed.
            else {
                unsetFieldError(fieldName);
            }
        }

        // Return if the form validated with no errors or not.
        return isValid;
    }


    /**
     * ---------------------------------------------------------
     * Events
     * ---------------------------------------------------------
     */

    /**
     * Activates fields when they are changed for the first time,
     * and then validate all activate fields.
     */
    $(fieldElements).change(function(){
        var fieldId = $(this).attr('id');
        activateField(fieldId);
        that.validate();
    });

    /**
     * Preps the form fields by prepending new error elements to
     * display individual field errors before each field.
     */
    $(fieldElements).each(function(){
        $(this).before('<div id="field-error-' + $(this).attr('id') + '" class="field-error"><div class="field-error-message">Message</div></div>');
    });

    /**
     * Validates the form when it is submitted, and blocks
     * its action if there are errors.
     */
    $(formElement).submit(function(e){

        // Activate all fields.  The user submitted, so it's on like Donkey Kong.
        for (var i in fields) {
            activateField(fields[i].name);
        }

        // Validate the entire form, and prevent submission if there are any errors.
        if (that.validate() === false) {
            e.preventDefault();
        }
    });
}
