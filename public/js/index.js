/**
 * @fileoverview Main entry point for the array visualization application.
 * Handles initial setup, GUI interaction, and orchestrates the visualization.
 */

import { enableGUI, enableViz, disableGUI, startGUI } from './gui.js';
import { validJSONArray, validCSVArray, parseCSVArray, arrayShape } from './array-utils.js';
import { isNumeric } from './types.js'
import { highlightValue, highlightInequality, resetScale } from './visualization.js';

/** @type {Array | undefined} */
let array;

// Check whether using GUI.
$.get("/gui", gui => {
    if (gui) {
        enableGUI(); // Setup gui and wait for button click to fetch array input.
    } else {
        enableViz();
        // Fetch array from saved file from server.
        $.get("/data", data => {
            $(".result").html(data);
            array = JSON.parse(data);
            startGUI(array);
        });
    }
});

window.runInput = () => {
    const input = $("#arrayInput").val()?.toString().replace(/[ \t]+/g, "");
    if (input) {
        let parsedArray;
        if (validJSONArray(input)) {
            parsedArray = JSON.parse(input);
            if (arrayShape(parsedArray).length > 3) {
                alert("Maximum of 3 dimensions allowed for JSON array.");
                return;
            }
        } else if (validCSVArray(input)) {
            parsedArray = parseCSVArray(input);
        } else {
            alert("JSON or CSV format required.");
            return;
        }

        if (parsedArray) {
            console.log(parsedArray);
            disableGUI();
            enableViz();
            array = parsedArray;
            startGUI(array);
        }
    } else {
        alert("JSON or CSV format required.");
    }
};

window.handleEqualityInput = function() {
    const equalityInput = document.getElementById("equalityQuery");
    const equalityInputValue = equalityInput?.value;
    
    if (isNumeric(equalityInputValue)) {
        highlightValue(parseFloat(equalityInputValue));
    } else if (equalityInputValue === "") {
        resetScale();
    }
    
    // Erase any inequality input
    const lessThanInput = document.getElementById("lessThanQuery");
    const greaterThanInput = document.getElementById("greaterThanQuery");
    if (lessThanInput) lessThanInput.value = "";
    if (greaterThanInput) greaterThanInput.value = "";
};

window.handleLessThanInput = function() {
    const lessThanInput = document.getElementById("lessThanQuery");
    const greaterThanInput = document.getElementById("greaterThanQuery");
    const equalityInput = document.getElementById("equalityQuery");
    
    const lessThanInputValue = lessThanInput?.value;
    const greaterThanInputValue = greaterThanInput?.value;
    
    if (isNumeric(lessThanInputValue)) {
        let high = Number.POSITIVE_INFINITY;
        if (isNumeric(greaterThanInputValue)) {
            high = parseFloat(greaterThanInputValue);
        }
        highlightInequality(parseFloat(lessThanInputValue), high);
    } else if (isNumeric(greaterThanInputValue)) {
        // If just erased less than input, but greater than input available.
        highlightInequality(
            Number.NEGATIVE_INFINITY,
            parseFloat(greaterThanInputValue)
        );
    } else if (greaterThanInputValue === "") {
        resetScale();
    }
    
    if (equalityInput) equalityInput.value = ""; // Erase any equality input.
};

window.handleGreaterThanInput = function() {
    const lessThanInput = document.getElementById("lessThanQuery");
    const greaterThanInput = document.getElementById("greaterThanQuery");
    const equalityInput = document.getElementById("equalityQuery");
    
    const lessThanInputValue = lessThanInput?.value;
    const greaterThanInputValue = greaterThanInput?.value;
    
    if (isNumeric(greaterThanInputValue)) {
        let low = Number.NEGATIVE_INFINITY;
        if (isNumeric(lessThanInputValue)) {
            low = parseFloat(lessThanInputValue);
        }
        highlightInequality(low, parseFloat(greaterThanInputValue));
    } else if (isNumeric(lessThanInputValue)) {
        // If just erased greater than input, but less than input still available.
        highlightInequality(
            parseFloat(lessThanInputValue),
            Number.POSITIVE_INFINITY
        );
    } else if (lessThanInputValue === "") {
        resetScale();
    }
    
    if (equalityInput) equalityInput.value = ""; // Erase any equality input.
};
