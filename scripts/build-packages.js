import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const packagesDir = './packages/sim-modules';

console.log('Building all simulation packages...');

// Get all directories in the packages directory
const packageDirs = readdirSync(packagesDir).filter(item => {
  const itemPath = join(packagesDir, item);
  return existsSync(join(itemPath, 'package.json')) && 
         existsSync(join(itemPath, 'tsconfig.json'));
});

console.log(`Found ${packageDirs.length} packages to build:`, packageDirs);

// Build each package
for (const dir of packageDirs) {
  const packagePath = join(packagesDir, dir);
  console.log(`\n--- Building ${dir} ---`);
  
  try {
    // Install dependencies for this package
    console.log(`Installing dependencies for ${dir}...`);
    execSync('npm install', { cwd: packagePath, stdio: 'inherit' });
    
    // Build this package
    console.log(`Building ${dir}...`);
    execSync('npm run build', { cwd: packagePath, stdio: 'inherit' });
    
    console.log(`${dir} built successfully!`);
  } catch (error) {
    console.error(`Error building ${dir}:`, error.message);
    process.exit(1); // Exit with error code if any package fails to build
  }
}

console.log('\nAll packages built successfully!');