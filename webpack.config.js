let lFilereader = require('fs');
let lFileContent = lFilereader.readFileSync('package.json', 'utf8');
let lFileJson = JSON.parse(lFileContent);

const PROJECT_NAME = lFileJson["name"];
const ENTRY_POINT_PATH = "./BrowserScratchpad/Source/index.ts";

let lValidEntryPoints = [];
if (lFilereader.existsSync(ENTRY_POINT_PATH)) {
    lValidEntryPoints.push(ENTRY_POINT_PATH);
} else {
    lValidEntryPoints.push('./package.json');
}

module.exports = {
    devtool: 'inline-source-map',
    target: 'web',
    entry: lValidEntryPoints,
    mode: "development",
    output: {
        filename: "../Page/" + PROJECT_NAME + ".user.js"
    },
    resolve: {
        extensions: ['.ts', '.json', '.js']
    },
    node: false,
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: {
                    loader: "ts-loader"
                }
            }
        ]
    },
    watchOptions: {
        aggregateTimeout: 1000,
        ignored: /node_modules/,
        poll: 1000
    }
};