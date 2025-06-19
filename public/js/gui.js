/**
 * @fileoverview GUI utility functions for controlling visualization interface elements
 */

import { animate } from "./visualization.js";
import { init, setArrayDimensions, graphDistribution } from "./visualization.js";

/**
 * Hides the GUI control panel by setting its display to none.
 * Uses jQuery to target the element with ID "gui".
 */
export function disableGUI() {
	$("#gui").css("display", "none");
}

/**
 * Shows the GUI control panel by setting its display to flex.
 * Uses jQuery to target the element with ID "gui".
 */
export function enableGUI() {
	$("#gui").css("display", "flex");
}

/**
 * Hides the data visualization components including the main visualization,
 * equality container, and inequality container elements.
 * Uses jQuery to target multiple DOM elements.
 */
export function disableViz() {
	$("#dataViz").css("display", "none");
	$(".equality-container").css("display", "none");
	$(".inequality-container").css("display", "none");
}

/**
 * Shows the data visualization components by making the main visualization
 * block-level and the equality/inequality containers flex-level.
 * Uses jQuery to target multiple DOM elements.
 */
export function enableViz() {
	$("#dataViz").css("display", "block");
	$(".equality-container").css("display", "flex");
	$(".inequality-container").css("display", "flex");
}

/**
 * Initializes and starts the complete GUI visualization system for the given array.
 * This function orchestrates the setup of distribution graph, array dimensions display,
 * 3D visualization initialization, and animation loop.
 * @param {import('./types.js').Array1D|import('./types.js').Array2D|import('./types.js').Array3D} arr - Array to visualize (1D, 2D, or 3D)
 */
export function startGUI(arr) {
	graphDistribution(arr);
    setArrayDimensions(arr);
	init(arr);
	animate();
}