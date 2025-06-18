/**
 * @fileoverview Main entry point for the array visualization application.
 * Handles initial setup, GUI interaction, and orchestrates the visualization.
 */

import { enableGUI, enableViz, disableGUI, startGUI } from './gui.js';
import { validJSONArray, validCSVArray, parseCSVArray, arrayShape } from './array-utils.js';

/** @type {Array | undefined} */
let array;

// Check whether using GUI.
$.get("/gui", gui => {
    console.log("GUI enabled:", gui);
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

