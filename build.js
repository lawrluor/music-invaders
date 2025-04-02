const fs = require('fs');
const path = require('path');
const Terser = require('terser');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Function to minify a file
async function minifyFile(srcPath, destPath, envConfig) {
    try {
        const fileContent = fs.readFileSync(srcPath, 'utf8');
        
        // Replace environment variable placeholders with actual values
        const envContent = fileContent
            .replace(/"__FIREBASE_API_KEY__"/g, JSON.stringify(envConfig.FIREBASE_API_KEY))
            .replace(/"__FIREBASE_AUTH_DOMAIN__"/g, JSON.stringify(envConfig.FIREBASE_AUTH_DOMAIN))
            .replace(/"__FIREBASE_PROJECT_ID__"/g, JSON.stringify(envConfig.FIREBASE_PROJECT_ID))
            .replace(/"__FIREBASE_STORAGE_BUCKET__"/g, JSON.stringify(envConfig.FIREBASE_STORAGE_BUCKET))
            .replace(/"__FIREBASE_MESSAGING_SENDER_ID__"/g, JSON.stringify(envConfig.FIREBASE_MESSAGING_SENDER_ID))
            .replace(/"__FIREBASE_APP_ID__"/g, JSON.stringify(envConfig.FIREBASE_APP_ID))
            .replace(/"__FIREBASE_MEASUREMENT_ID__"/g, JSON.stringify(envConfig.FIREBASE_MEASUREMENT_ID));

        // Minify with obfuscation options
        const result = await Terser.minify(envContent, {
            mangle: true,
            compress: true,
            format: {
                comments: false,
                beautify: false
            }
        });

        if (result.error) {
            console.error(`Error minifying ${srcPath}:`, result.error);
            return;
        }

        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.writeFileSync(destPath, result.code);
        console.log(`Successfully minified ${srcPath}`);
    } catch (error) {
        console.error(`Error processing ${srcPath}:`, error);
    }
}

// Load environment configuration
require('dotenv').config();

const envConfig = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID
};

// List of JS files to minify
const jsFiles = [
    'js/chords.js',
    'js/enemy.js',
    'js/firebase.js',
    'js/game.js',
    'js/laser.js',
    'js/main.js',
    'js/midi.js',
    'js/player.js',
    'js/sound.js',
    'js/utils.js'
];

// Process each JS file
jsFiles.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(buildDir, file);
    minifyFile(src, dest, envConfig);
});

// Copy HTML and CSS files to build directory
const copyFiles = [
    'index.html',
    'css/style.css',
    'css/popup.css'
];

copyFiles.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(buildDir, file);
    const destDir = path.dirname(dest);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
});

// Copy images to build directory
const copyImages = [
    'img/sprites/enemy_blue.png',
    'img/sprites/enemy_yellow.png',
    'img/sprites/enemy_red.png',
    'img/sprites/enemy_purple.png',
    'img/sprites/enemy_orange.png',
    'img/sprites/player.png'
];

copyImages.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(buildDir, file);
    const destDir = path.dirname(dest);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
    console.log(`Copied image ${file}`);
});

console.log('Build completed successfully!');
