#!/bin/bash

# Build the project
npm run build

# Switch to gh-pages branch
git checkout gh-pages

# Copy build files to root
cp -r dist/* .

# Add and commit changes
git add .
git commit -m "Deploy updated build"

# Push to gh-pages
git push origin gh-pages

# Switch back to main
git checkout main

echo "Deployment complete! Check https://paddybishop.github.io/voicey/"