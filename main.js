import express from "express";
import fs, { write } from "fs";
import npyjs from "npyjs";
import path from "path";
import { fileURLToPath } from "url";
import ndarray from "ndarray";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFilePath() {
	const path = process.argv[2];

	if (path === undefined) {
		return undefined;
	}
	// Default to json data format
	if (!path.slice(1).includes(".")) {
		return path + ".json";
	}

	return path;
}

async function fileExists(file) {
	try {
		await fs.promises.access(file, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function storeWorkingJSON(data) {
	fs.writeFile("data/temp/temp.json", data, "utf8", (err) => {
		if (err) {
			console.log(`Error writing file: ${err}`);
		}
	});
}

function loadJSON(path) {
	fs.readFile(path, "utf8", (err, data) => {
		if (err) {
			console.log(`Error reading file from disk: ${err}`);
			return;
		}
		storeWorkingJSON(data);
	});
}

function ndArrayToArray(ndArray) {
	switch (ndArray.shape.length) {
		case 1:
			return ndArrayToArray1D(ndArray);
		case 2:
			return ndArrayToArray2D(ndArray);
		case 3:
			return ndArrayToArray3D(ndArray);
		default:
			throw new Error("Only ndArrays with 1, 2 or 3 dimensions are supported.");
	}
}

function ndArrayToArray1D(ndArray) {
	return Array.from(ndArray.data);
}

function ndArrayToArray2D(ndArray) {
	const arr = new Array(ndArray.shape[0]).fill(
		new Array(ndArray.shape[1]).fill(0)
	);
	for (let i = 0; i < ndArray.shape[0]; i++) {
		for (let j = 0; j < ndArray.shape[1]; j++) {
			arr[i][j] = ndArray.get(i, j);
		}
	}
	return arr;
}

function ndArrayToArray3D(ndArray) {
	const arr = new Array(ndArray.shape[0]).fill(
		new Array(ndArray.shape[1]).fill(new Array(ndArray.shape[2]).fill(0))
	);
	for (let i = 0; i < ndArray.shape[0]; i++) {
		for (let j = 0; j < ndArray.shape[1]; j++) {
			for (let k = 0; k < ndArray.shape[2]; k++) {
				arr[i][j][k] = ndArray.get(i, j, k);
			}
		}
	}
	return arr;
}

function loadNumPy(filePath) {
	const n = new npyjs();
	const buf = fs.readFileSync(filePath);
	const npyData = n.parse(buf.buffer.slice(0, buf.buffer.length));

	const npyArray = ndarray(npyData.data, npyData.shape);
	const data = JSON.stringify(ndArrayToArray(npyArray));

	storeWorkingJSON(data);
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

function convertToJSON(filePath) {
	if (filePath === undefined) {
		return;
	}

	const extension = getFileExtension(filePath);
	switch (extension) {
		case "json":
			loadJSON(filePath);
			break;
		case "npy":
		case "npz":
			// Load target .npy file and save it in json format.
			loadNumPy(filePath);
			break;
		default:
			throw new Error("File type not supported.");
	}
}

function getFileExtension(filePath) {
	return filePath.split(".").slice(-1)[0];
}

function run(guiEnabled) {
	const app = express();
	const port = process.env.PORT || 8080;

	app.use(express.static(__dirname + "/public"));

	app.get("/", function (req, res) {
		res.render("index.html");
	});

	// To return whether GUI version enabled.
	app.get("/gui", function (req, res) {
		res.send(guiEnabled);
	});

	if (!guiEnabled) {
		// To return array data read from file.
		app.get("/data", function (req, res) {
			const readable = fs.createReadStream("data/temp/temp.json");
			readable.pipe(res);
		});
	}

	app.listen(port);
	console.log("Server started at: http://localhost:" + port);
}

function isGUIEnabled() {
	// GUI enabled if no file path argument has been provided.
	return process.argv.length != 3;
}

const guiEnabled = isGUIEnabled();

if (guiEnabled) {
	run(guiEnabled);
} else {
	const filePath = getFilePath();

	fileExists(filePath).then((exists) => {
		if (exists) {
			convertToJSON(filePath); // Save target data into data/temp.json.
			run(guiEnabled);
		} else {
			console.log(`Data file path ${filePath} is invalid.`);
		}
	});
}
