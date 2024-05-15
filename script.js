// Access the version passed as an argument
const version = process.argv[2];

if (!version) {
	console.error('No version provided');
	process.exit(1);
}

// Your existing script logic here
console.log(`Processing version: ${version}`);

// Example: Add your processing logic based on the version here
// ... your code ...
