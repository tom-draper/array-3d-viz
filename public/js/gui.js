import { animate } from "./visualization.js";
import { init, setArrayDimensions, graphDistribution } from "./visualization.js";

export function disableGUI() {
	$("#gui").css("display", "none");
}

export function enableGUI() {
	$("#gui").css("display", "flex");
}

export function disableViz() {
	$("#dataViz").css("display", "none");
	$(".equality-container").css("display", "none");
	$(".inequality-container").css("display", "none");
}

export function enableViz() {
	$("#dataViz").css("display", "block");
	$(".equality-container").css("display", "flex");
	$(".inequality-container").css("display", "flex");
}

export function startGUI(arr) {
	graphDistribution(arr);
    setArrayDimensions(arr);
	init(arr);
	animate();
}
