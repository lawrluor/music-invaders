const fs = require('fs');
const path = require('path');
const Terser = require('terser');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Function to copy directory recursively
function copyDir(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    const files = fs.readdirSync(srcDir);
    
    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        
        const stat = fs.statSync(srcPath);
        
        if (stat.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Function to minify a file
async function minifyFile(srcPath, destPath) {
    try {
        const fileContent = fs.readFileSync(srcPath, 'utf8');
        
        // Minify with obfuscation options
        const result = await Terser.minify(fileContent, {
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
    'js/utils.js',
];

// Process each JS file
jsFiles.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(buildDir, file);
    minifyFile(src, dest);
});

// Copy HTML and CSS files to build directory
const copyFiles = [
    'index.html',
    'css/style.css',
    'css/popup.css',
    'css/sprites.css',
    'css/fontawesome.min.css'
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

// Copy images directory
const imagesDir = path.join(__dirname, 'img');
if (fs.existsSync(imagesDir)) {
    copyDir(imagesDir, path.join(buildDir, 'img'));
    console.log('Copied images directory');
}

console.log('Build completed successfully!');
