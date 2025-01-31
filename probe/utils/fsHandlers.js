const fs = require('fs');
const Path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

/**
 * @description a promise based utility to read content of a file
 * @param {string} filePath path to file
 */
function readFileContent(filePath) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, { encoding: 'utf8' }, function(error, data) {
                if (error) {
                    reject(error);
                }
                resolve(data);
            });
        }
    });
}

/**
 * @description an asynchronous function to handle deleting a file
 * @param {string} file path to file
 */
async function deleteFile(file) {
    if (fs.existsSync(file)) {
        await unlink(file);
    }
}

/**
 * @description a promise based utility to handle deleting a folder and it's content
 * @param {string} dir directory with or without file
 */
async function deleteFolderRecursive(dir) {
    if (fs.existsSync(dir)) {
        const entries = await readdir(dir, { withFileTypes: true });
        await Promise.all(
            entries.map(entry => {
                const fullPath = Path.join(dir, entry.name);
                return entry.isDirectory()
                    ? deleteFolderRecursive(fullPath)
                    : unlink(fullPath);
            })
        );
        await rmdir(dir); // finally remove now empty directory
    }
}

module.exports = {
    readFileContent,
    deleteFile,
    deleteFolderRecursive,
};
