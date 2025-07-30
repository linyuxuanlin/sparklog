#!/bin/bash

echo "Starting build process..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "Installing dependencies..."
npm install

# Run build
echo "Running build..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "Build successful! Contents of dist directory:"
    ls -la dist/
    echo "Assets directory:"
    ls -la dist/assets/
else
    echo "Build failed - dist directory not found"
    exit 1
fi

echo "Build process completed." 