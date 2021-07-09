// Imports
const Webpack = require('webpack');
const Path = require('path');
const Filereader = require('fs');
var glob = require("glob");

/**
 * Read Project name for output name
 */
const getProjectName = () => {
    const lPackageFileContent = Filereader.readFileSync('package.json', 'utf8');
    const lPackageFileJson = JSON.parse(lPackageFileContent);
    return lPackageFileJson["name"];
};


// Load and construct user script header.
const getHeader = () => {
    const lHeaderFileContent = Filereader.readFileSync('./UserScript/Header.json', 'utf8');
    const lHeaderFileJson = JSON.parse(lHeaderFileContent);

    // Starting header
    let lHeaderString = "// ==UserScript==" + "\n";

    for (const lHeaderKey in lHeaderFileJson) {
        if (lHeaderFileJson.hasOwnProperty(lHeaderKey)) {
            let lHeaderContent = lHeaderFileJson[lHeaderKey];

            // Check for header content. Replace with String.Empty if null.
            if (lHeaderContent === null) {
                lHeaderContent = "";
            }

            lHeaderString += `// @${lHeaderKey} ${lHeaderContent}` + "\n";
        }
    }

    // Ending header
    lHeaderString += "// ==/UserScript==" + "\n";

    return lHeaderString;
};

module.exports = {
    target: 'web',
    entry: {
        // Include all typescript files.
        ts: glob.sync("./Source/**/*.ts", { ignore: "./**/*.d.ts" })
    },
    mode: "development",
    devtool: false,
    output: {
        filename: `${getProjectName()}.user.js`,
        path: Path.resolve(__dirname, 'Build'),
    },
    resolve: {
        extensions: ['.ts', '.js', '.css', '.html']
    },
    module: {
        rules: [
            { test: /\.ts?$/, use: "ts-loader" },
            { test: /\.css$|\.html$/, use: 'raw-loader' },
        ]
    },
    plugins: [
        new Webpack.BannerPlugin({
            banner: getHeader(),
            raw: true
        })
    ],
    watchOptions: {
        aggregateTimeout: 1000,
        ignored: /node_modules/,
        poll: 1000
    }
};