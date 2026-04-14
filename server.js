import express from "express";
import fs from "fs";
import npyjs from "npyjs";
import path from "path";
import { fileURLToPath } from "url";
import ndarray from "ndarray";
import * as hdf5 from "jsfive";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import pickleparser from "pickleparser";
import parquet from "parquetjs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DATA_PATH = "data/temp/temp.json";

function isPlainObject(value) {
	return (
		value !== null &&
		typeof value === "object" &&
		!Array.isArray(value)
	);
}

function shapesEqual(a, b) {
	return (
		a.length === b.length && a.every((dimension, index) => dimension === b[index])
	);
}

function getNumericArrayShape(value, path = "root") {
	if (!Array.isArray(value)) {
		if (typeof value === "number" && Number.isFinite(value)) {
			return [];
		}

		throw new Error(
			`${path} contains a non-numeric value; only finite numbers are supported`
		);
	}

	if (value.length === 0) {
		throw new Error(`${path} is empty; empty arrays cannot be visualized`);
	}

	const firstShape = getNumericArrayShape(value[0], `${path}[0]`);

	for (let i = 1; i < value.length; i++) {
		const shape = getNumericArrayShape(value[i], `${path}[${i}]`);
		if (!shapesEqual(firstShape, shape)) {
			throw new Error(`${path} has inconsistent nested dimensions`);
		}
	}

	const fullShape = [value.length, ...firstShape];
	if (fullShape.length > 3) {
		throw new Error(
			`${path} has ${fullShape.length} dimensions; only 1D, 2D, and 3D arrays are supported`
		);
	}

	return fullShape;
}

function rowsOfNumericObjectsToMatrix(value) {
	if (
		!Array.isArray(value) ||
		value.length === 0 ||
		!value.every(isPlainObject)
	) {
		return null;
	}

	const keys = Object.keys(value[0]);
	if (keys.length === 0) {
		return null;
	}

	for (const row of value) {
		const rowKeys = Object.keys(row);
		if (!shapesEqual(keys, rowKeys)) {
			return null;
		}

		for (const key of keys) {
			if (typeof row[key] !== "number" || !Number.isFinite(row[key])) {
				return null;
			}
		}
	}

	return value.map(row => keys.map(key => row[key]));
}

function collectVisualizationCandidates(value, candidates, path = "root") {
	if (candidates.length > 1) {
		return;
	}

	try {
		getNumericArrayShape(value, path);
		candidates.push(value);
		return;
	} catch {}

	const rowMatrix = rowsOfNumericObjectsToMatrix(value);
	if (rowMatrix) {
		candidates.push(rowMatrix);
		return;
	}

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			collectVisualizationCandidates(value[i], candidates, `${path}[${i}]`);
			if (candidates.length > 1) {
				return;
			}
		}
		return;
	}

	if (!isPlainObject(value)) {
		return;
	}

	for (const [key, child] of Object.entries(value)) {
		collectVisualizationCandidates(child, candidates, `${path}.${key}`);
		if (candidates.length > 1) {
			return;
		}
	}
}

function normalizeVisualizationData(data, sourceDescription) {
	try {
		getNumericArrayShape(data);
		return data;
	} catch {}

	const rowMatrix = rowsOfNumericObjectsToMatrix(data);
	if (rowMatrix) {
		return rowMatrix;
	}

	const candidates = [];
	collectVisualizationCandidates(data, candidates);

	if (candidates.length === 1) {
		getNumericArrayShape(candidates[0]);
		return candidates[0];
	}

	if (candidates.length > 1) {
		throw new Error(
			`${sourceDescription} contains multiple numeric arrays. Please provide a file with a single numeric 1D, 2D, or 3D array.`
		);
	}

	throw new Error(
		`${sourceDescription} does not contain a numeric 1D, 2D, or 3D array that can be visualized.`
	);
}

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

async function storeVisualizationData(data, sourceDescription) {
	const normalizedData = normalizeVisualizationData(data, sourceDescription);
	await storeWorkingJSON(JSON.stringify(normalizedData));
}

/**
 * Loads a JSON file and stores it as working data
 * @param {string} filePath - Path to the JSON file
 * @throws {Error} If reading the file fails
 */
async function loadJSON(filePath) {
	try {
		const data = await fs.promises.readFile(filePath, "utf8");
		await storeVisualizationData(
			JSON.parse(data),
			`JSON file "${path.basename(filePath)}"`
		);
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

		const records = parse(data, {
			columns: false,
			skip_empty_lines: true,
			trim: true,
			cast: value => {
				if (value === "" || value === null || value === undefined) {
					return null;
				}

				const num = Number(value);
				if (!isNaN(num) && isFinite(num)) {
					return num;
				}

				return value;
			},
		});

		const normalizedRecords =
			records.length === 1 ? records[0] : records;
		await storeVisualizationData(
			normalizedRecords,
			`CSV file "${path.basename(filePath)}"`
		);
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
			throw new Error(
				`Unsupported ndarray dimensions: ${shape.length}. Only 1D, 2D, and 3D arrays are supported.`
			);
	}
}

/**
 * Recursively processes HDF5 groups and datasets to extract data
 * @param {Object} item - The HDF5 group or dataset
 * @param {string} path - Current path in the HDF5 hierarchy
 * @returns {Object} Processed data structure
 */
function processHDF5Item(item, path = "") {
	if (item.type === "group") {
		const groupData = {};

		// Add metadata if available
		if (item.attrs && Object.keys(item.attrs).length > 0) {
			groupData._attrs = item.attrs;
		}

		// Process all children
		for (const [name, child] of Object.entries(item.children || {})) {
			const childPath = path ? `${path}/${name}` : name;
			groupData[name] = processHDF5Item(child, childPath);
		}

		return groupData;
	} else if (item.type === "dataset") {
		const result = {
			shape: item.shape,
			dtype: item.dtype,
			data: null,
		};

		// Add attributes if available
		if (item.attrs && Object.keys(item.attrs).length > 0) {
			result.attrs = item.attrs;
		}

		try {
			// Get the actual data
			const data = item.value;

			if (data !== null && data !== undefined) {
				// Handle different data types
				if (Array.isArray(data)) {
					result.data = data;
				} else if (
					data.constructor &&
					data.constructor.name.includes("Array")
				) {
					// Handle typed arrays (Float32Array, Int32Array, etc.)
					result.data = Array.from(data);
				} else {
					result.data = data;
				}
			}
		} catch (error) {
			console.warn(
				`Warning: Could not read data for dataset at ${path}: ${error.message}`
			);
			result.data = null;
		}

		return result;
	}

	return item;
}

/**
 * Loads an HDF5 file and converts it to JSON format
 * @param {string} filePath - Path to the HDF5 file
 * @throws {Error} If loading or parsing the HDF5 file fails
 */
async function loadHDF5(filePath) {
	try {
		// Read the HDF5 file
		const buffer = readFileSync(filePath);
		const f = new hdf5.File(buffer.buffer, filePath);

		// Process the root group
		const rootData = processHDF5Item(f, "");

		// Create a structured output
		const output = {
			filename: path.basename(filePath),
			filesize: buffer.length,
			root: rootData,
		};

		await storeVisualizationData(
			output,
			`HDF5 file "${path.basename(filePath)}"`
		);

		console.log(`Successfully loaded HDF5 file: ${filePath}`);
		console.log(
			`File contains ${Object.keys(rootData).length} root-level items`
		);
	} catch (error) {
		console.error(`Error loading HDF5 file: ${error}`);
		throw error;
	}
}

/**
 * Loads a NumPy file (.npy) and converts it to JSON format
 * @param {string} filePath - Path to the NumPy file
 * @throws {Error} If loading or parsing the NumPy file fails
 */
async function loadNumPy(filePath) {
	// Run Python script to load target .npy file and save it in json format.
	try {
		const buffer = await fs.promises.readFile(filePath);
		const npyLoader = new npyjs();
		const npyData = npyLoader.parse(
			buffer.buffer.slice(0, buffer.buffer.length)
		);

		const npyArray = ndarray(npyData.data, npyData.shape);
		const arrayData = convertNdArrayToArray(npyArray);
		await storeVisualizationData(
			arrayData,
			`NumPy file "${path.basename(filePath)}"`
		);
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
 * Loads a Python pickle file and converts it to JSON format
 * @param {string} filePath - Path to the pickle file
 * @throws {Error} If loading or parsing the pickle file fails
 */
async function loadPickle(filePath) {
	try {
		const buffer = await fs.promises.readFile(filePath);
		const parser = new pickleparser.Parser();
		const pickleData = parser.parse(buffer);

		await storeVisualizationData(
			pickleData,
			`pickle file "${path.basename(filePath)}"`
		);

		console.log(`Successfully loaded pickle file: ${filePath}`);
	} catch (error) {
		console.error(`Error loading pickle file: ${error.message}`);
		throw error;
	}
}

/**
 * Loads a Parquet file and converts it to JSON format
 * @param {string} filePath - Path to the Parquet file
 * @throws {Error} If loading or parsing the Parquet file fails
 */
async function loadParquet(filePath) {
	try {
		const reader = await parquet.ParquetReader.openFile(filePath);
		const cursor = reader.getCursor();
		const rows = [];
		let record = null;

		// Read all rows
		while ((record = await cursor.next())) {
			rows.push(record);
		}

		await reader.close();

		// Convert rows to JSON
		await storeVisualizationData(
			rows,
			`Parquet file "${path.basename(filePath)}"`
		);

		console.log(`Successfully loaded Parquet file: ${filePath}`);
		console.log(`File contains ${rows.length} rows`);
	} catch (error) {
		console.error(`Error loading Parquet file: ${error.message}`);
		throw error;
	}
}

/**
 * Recursively converts BigInt values to Numbers in an object
 * @param {any} obj - The object to convert
 * @returns {any} The converted object
 */
function convertBigIntsToNumbers(obj) {
	if (typeof obj === "bigint") {
		return Number(obj);
	} else if (Array.isArray(obj)) {
		return obj.map(convertBigIntsToNumbers);
	} else if (obj !== null && typeof obj === "object") {
		const converted = {};
		for (const [key, value] of Object.entries(obj)) {
			converted[key] = convertBigIntsToNumbers(value);
		}
		return converted;
	}
	return obj;
}

/**
 * Loads a MATLAB .mat file and converts it to JSON format using Python
 * @param {string} filePath - Path to the MATLAB file
 * @throws {Error} If loading or parsing the MATLAB file fails
 */
async function loadMatlab(filePath) {
	try {
		// Use Python's scipy.io to read the MATLAB file since JavaScript libraries have bugs
		const scriptPath = path.join(__dirname, "scripts", "load_matlab.py");
		const { stdout, stderr } = await execAsync(
			`python3 "${scriptPath}" "${filePath}"`
		);

		if (stderr && stderr.trim()) {
			console.warn(`Python warning: ${stderr}`);
		}

		const output = stdout.trim();

		let matlabData;
		try {
			matlabData = JSON.parse(output);
		} catch (parseError) {
			throw new Error(`Failed to parse MATLAB file: ${output}`);
		}

		if (matlabData.error) {
			throw new Error(matlabData.error);
		}

		await storeVisualizationData(
			matlabData,
			`MATLAB file "${path.basename(filePath)}"`
		);

		console.log(`Successfully loaded MATLAB file: ${filePath}`);
	} catch (error) {
		console.error(`Error loading MATLAB file: ${error.message}`);
		throw error;
	}
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
			await loadNumPy(filePath);
			break;
		case "hdf5":
		case "h5":
		case "hdf":
			await loadHDF5(filePath);
			break;
		case "pickle":
		case "pkl":
			await loadPickle(filePath);
			break;
		case "parquet":
			await loadParquet(filePath);
			break;
		case "mat":
			await loadMatlab(filePath);
			break;
		default:
			throw new Error(
				`Unsupported file type: .${extension}. Supported formats: json, csv, npy, hdf5, h5, hdf, pickle, pkl, parquet, mat`
			);
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

	app.get("/about", (req, res) => {
		res.sendFile(path.join(__dirname, "public", "about.html"));
	});

	app.get("/privacy", (req, res) => {
		res.sendFile(path.join(__dirname, "public", "privacy.html"));
	});

	app.get("/terms", (req, res) => {
		res.sendFile(path.join(__dirname, "public", "terms.html"));
	});

	// app.get("/ads.txt", (req, res) => {
	// 	res.redirect(301, "https://srv.adstxtmanager.com/19390/arrayviz.com");
	// });

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
		console.log(`Server listening at: http://localhost:${port}`);
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
				console.error(
					`Data file path ${filePath} is invalid or file does not exist.`
				);
				process.exit(1);
			}

			console.log(`Processing file: ${filePath}`);
			await convertToJSON(filePath);
			console.log("File processed successfully");

			startServer(guiEnabled);
		}
	} catch (error) {
		console.error("Application error:", error);
		process.exit(1);
	}
}

// Start the application
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
