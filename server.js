import express from "express";
import fs from "fs";
import npyjs from "npyjs";
import path from "path";
import { fileURLToPath } from "url";
import ndarray from "ndarray";
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DATA_PATH = "data/temp/temp.json";

/**
 * Gets the file path from command line arguments and ensures it has the correct extension
 * @returns {string|undefined} The file path with extension, or undefined if no path provided
 */
function getFilePath() {
	const filePath = process.argv[2];

	if (!filePath) {
		return undefined;
	}

	// Add .json extension if no extension provided
	if (!filePath.includes(".")) {
		return `${filePath}.json`;
	}

	return filePath;
}

/**
 * Checks if a file exists at the given path
 * @param {string} filePath - The path to check
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(filePath) {
	try {
		await fs.promises.access(filePath, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

/**
 * Extracts the file extension from a file path
 * @param {string} filePath - The file path
 * @returns {string} The file extension in lowercase (without the dot)
 */
function getFileExtension(filePath) {
	return path.extname(filePath).slice(1).toLowerCase();
}

/**
 * Determines if GUI mode is enabled based on command line arguments
 * @returns {boolean} True if GUI is enabled (no file path argument), false otherwise
 */
function isGUIEnabled() {
	// Simply GUI enabled if no file path argument has been provided.
	return process.argv.length !== 3;
}

/**
 * Stores JSON data to the temporary working file
 * @param {string} data - The JSON data to store
 * @throws {Error} If writing to file fails
 */
async function storeWorkingJSON(data) {
	try {
		await fs.promises.writeFile(TEMP_DATA_PATH, data, "utf8");
	} catch (error) {
		console.error(`Error writing temporary file: ${error.message}`);
		throw error;
	}
}

/**
 * Loads a JSON file and stores it as working data
 * @param {string} filePath - Path to the JSON file
 * @throws {Error} If reading the file fails
 */
async function loadJSON(filePath) {
	try {
		const data = await fs.promises.readFile(filePath, "utf8");
		await storeWorkingJSON(data);
	} catch (error) {
		console.error(`Error reading JSON file: ${error.message}`);
		throw error;
	}
}

/**
 * Loads a CSV file and converts it to JSON format
 * @param {string} filePath - Path to the CSV file
 * @throws {Error} If reading or parsing the file fails
 */
async function loadCSV(filePath) {
	try {
		const data = await fs.promises.readFile(filePath, "utf8");
		
		// Parse CSV with headers detection
		const records = parse(data, {
			columns: true, // Use first row as headers
			skip_empty_lines: true,
			trim: true,
			cast: (value, context) => {
				// Try to convert to number if possible, otherwise keep as string
				if (value === '' || value === null || value === undefined) {
					return null;
				}
				
				const num = Number(value);
				if (!isNaN(num) && isFinite(num)) {
					return num;
				}
				
				return value;
			}
		});

		// If parsing with headers fails or produces empty result, try without headers
		if (!records || records.length === 0) {
			const recordsNoHeaders = parse(data, {
				columns: false, // Don't use headers
				skip_empty_lines: true,
				trim: true,
				cast: (value, context) => {
					if (value === '' || value === null || value === undefined) {
						return null;
					}
					
					const num = Number(value);
					if (!isNaN(num) && isFinite(num)) {
						return num;
					}
					
					return value;
				}
			});
			
			const jsonData = JSON.stringify(recordsNoHeaders);
			await storeWorkingJSON(jsonData);
		} else {
			const jsonData = JSON.stringify(records);
			await storeWorkingJSON(jsonData);
		}
	} catch (error) {
		console.error(`Error reading CSV file: ${error.message}`);
		throw error;
	}
}

/**
 * Converts a 1D ndarray to a JavaScript array
 * @param {ndarray} ndArray - The 1D ndarray to convert
 * @returns {Array} The converted JavaScript array
 */
function convertNdArray1D(ndArray) {
	return Array.from(ndArray.data);
}

/**
 * Converts a 2D ndarray to a JavaScript array of arrays
 * @param {ndarray} ndArray - The 2D ndarray to convert
 * @returns {Array<Array>} The converted 2D JavaScript array
 */
function convertNdArray2D(ndArray) {
	const [rows, cols] = ndArray.shape;
	const result = [];

	for (let i = 0; i < rows; i++) {
		const row = [];
		for (let j = 0; j < cols; j++) {
			row.push(ndArray.get(i, j));
		}
		result.push(row);
	}

	return result;
}

/**
 * Converts a 3D ndarray to a JavaScript array of arrays of arrays
 * @param {ndarray} ndArray - The 3D ndarray to convert
 * @returns {Array<Array<Array>>} The converted 3D JavaScript array
 */
function convertNdArray3D(ndArray) {
	const [depth, rows, cols] = ndArray.shape;
	const result = [];

	for (let i = 0; i < depth; i++) {
		const plane = [];
		for (let j = 0; j < rows; j++) {
			const row = [];
			for (let k = 0; k < cols; k++) {
				row.push(ndArray.get(i, j, k));
			}
			plane.push(row);
		}
		result.push(plane);
	}

	return result;
}

/**
 * Converts an ndarray to a JavaScript array based on its dimensions
 * @param {ndarray} ndArray - The ndarray to convert
 * @returns {Array} The converted JavaScript array
 * @throws {Error} If the ndarray has unsupported dimensions (not 1D, 2D, or 3D)
 */
function convertNdArrayToArray(ndArray) {
	const { shape } = ndArray;

	switch (shape.length) {
		case 1:
			return convertNdArray1D(ndArray);
		case 2:
			return convertNdArray2D(ndArray);
		case 3:
			return convertNdArray3D(ndArray);
		default:
			throw new Error(`Unsupported ndarray dimensions: ${shape.length}. Only 1D, 2D, and 3D arrays are supported.`);
	}
}

/**
 * Loads a NumPy file (.npy or .npz) and converts it to JSON format
 * @param {string} filePath - Path to the NumPy file
 * @throws {Error} If loading or parsing the NumPy file fails
 */
async function loadNumPy(filePath) {
	// Run Python script to load target .npy file and save it in json format.
	try {
		const buffer = await fs.promises.readFile(filePath);
		const npyLoader = new npyjs();
		const npyData = npyLoader.parse(buffer.buffer.slice(0, buffer.buffer.length));

		const npyArray = ndarray(npyData.data, npyData.shape);
		const arrayData = convertNdArrayToArray(npyArray);
		const jsonData = JSON.stringify(arrayData);

		await storeWorkingJSON(jsonData);
	} catch (error) {
		console.error(`Error loading NumPy file: ${error.message}`);
		throw error;
	}
}

/**
 * Alternative method to load NumPy files using Python (currently unused)
 * @param {string} filePath - Path to the NumPy file
 * @deprecated This function requires PythonShell which is not imported
 */
function loadNumPyWithPython(filePath) {
	// Run script to load target .npy file and save it in json format.
	PythonShell.run(
		"scripts/load.py",
		{ args: [filePath] },
		function (err, results) {
			if (err) {
				console.log(err, results);
			}
		}
	);
}

/**
 * Converts various file formats to JSON and stores as working data
 * @param {string} filePath - Path to the file to convert
 * @throws {Error} If file path is missing, file type is unsupported, or conversion fails
 */
async function convertToJSON(filePath) {
	if (!filePath) {
		throw new Error("File path is required");
	}

	const extension = getFileExtension(filePath);

	switch (extension) {
		case "json":
			await loadJSON(filePath);
			break;
		case "csv":
			await loadCSV(filePath);
			break;
		case "npy":
		case "npz":
			await loadNumPy(filePath);
			break;
		default:
			throw new Error(`Unsupported file type: .${extension}`);
	}
}

/**
 * Creates an Express server with appropriate routes
 * @param {boolean} guiEnabled - Whether GUI mode is enabled
 * @returns {{app: Express, port: number}} The Express app and port number
 */
function createServer(guiEnabled) {
	const app = express();
	const port = process.env.PORT || 8080;

	// Middleware
	app.use(express.static(path.join(__dirname, "public")));

	// Routes
	app.get("/", (req, res) => {
		res.sendFile(path.join(__dirname, "public", "index.html"));
	});

	app.get("/gui", (req, res) => {
		res.json(guiEnabled);
	});

	if (!guiEnabled) {
		app.get("/data", (req, res) => {
			const readable = fs.createReadStream(TEMP_DATA_PATH);
			readable.pipe(res);
		});
	}

	// Error handling
	app.use((error, req, res, next) => {
		console.error("Server error:", error);
		res.status(500).json({ error: "Internal server error" });
	});

	return { app, port };
}

/**
 * Starts the Express server
 * @param {boolean} guiEnabled - Whether GUI mode is enabled
 */
function startServer(guiEnabled) {
	const { app, port } = createServer(guiEnabled);

	app.listen(port, () => {
		console.log(`Server started at: http://localhost:${port}`);
	});
}

/**
 * Main application entry point
 * Handles both GUI and CLI modes, processes files, and starts the server
 */
async function main() {
	const guiEnabled = isGUIEnabled();

	try {
		if (guiEnabled) {
			// GUI mode - start server directly
			startServer(guiEnabled);
		} else {
			// CLI mode - process file first, then start server
			const filePath = getFilePath();

			if (!filePath) {
				console.error("No file path provided");
				process.exit(1);
			}

			const exists = await fileExists(filePath);

			if (!exists) {
				console.error(`Data file path ${filePath} is invalid or file does not exist.`);
				process.exit(1);
			}

			console.log(`Processing file: ${filePath}`);
			await convertToJSON(filePath);
			console.log("File processed successfully");

			startServer(guiEnabled);
		}
	} catch (error) {
		console.error("Application error:", error.message);
		process.exit(1);
	}
}

// Start the application
main().catch(error => {
	console.error("Fatal error:", error);
	process.exit(1);
});