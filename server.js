import express from "express";
import fs from "fs";
import npyjs from "npyjs";
import path from "path";
import { fileURLToPath } from "url";
import ndarray from "ndarray";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DATA_PATH = "data/temp/temp.json";

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

async function fileExists(filePath) {
	try {
		await fs.promises.access(filePath, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function getFileExtension(filePath) {
	return path.extname(filePath).slice(1).toLowerCase();
}

function isGUIEnabled() {
	// Simply GUI enabled if no file path argument has been provided.
	return process.argv.length !== 3;
}

async function storeWorkingJSON(data) {
	try {
		await fs.promises.writeFile(TEMP_DATA_PATH, data, "utf8");
	} catch (error) {
		console.error(`Error writing temporary file: ${error.message}`);
		throw error;
	}
}

async function loadJSON(filePath) {
	try {
		const data = await fs.promises.readFile(filePath, "utf8");
		await storeWorkingJSON(data);
	} catch (error) {
		console.error(`Error reading JSON file: ${error.message}`);
		throw error;
	}
}

function convertNdArray1D(ndArray) {
	return Array.from(ndArray.data);
}

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

async function convertToJSON(filePath) {
	if (!filePath) {
		throw new Error("File path is required");
	}

	const extension = getFileExtension(filePath);

	switch (extension) {
		case "json":
			await loadJSON(filePath);
			break;
		case "npy":
		case "npz":
			await loadNumPy(filePath);
			break;
		default:
			throw new Error(`Unsupported file type: .${extension}`);
	}
}

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

function startServer(guiEnabled) {
	const { app, port } = createServer(guiEnabled);

	app.listen(port, () => {
		console.log(`Server started at: http://localhost:${port}`);
	});
}


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

main().catch(error => {
	console.error("Fatal error:", error);
	process.exit(1);
});