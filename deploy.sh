#!/bin/bash

# Simple deployment script for GitHub Pages

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git and try again."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a git repository. Please run this script from within a git repository."
    exit 1
fi

# Get the repository name
repo_name=$(basename -s .git $(git config --get remote.origin.url 2>/dev/null || echo "space-invaders"))

# Prompt for GitHub username if not provided
if [ -z "$1" ]; then
    read -p "Enter your GitHub username: " github_username
else
    github_username=$1
fi

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    echo "Setting up remote repository..."
    git remote add origin "https://github.com/$github_username/$repo_name.git"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

# Instructions for GitHub Pages setup
echo ""
echo "===== DEPLOYMENT INSTRUCTIONS ====="
echo "1. Go to https://github.com/$github_username/$repo_name/settings/pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Under 'Branch', select 'main' (or 'master') and '/root', then click 'Save'"
echo "4. Wait a few minutes for GitHub Pages to build your site"
echo "5. Your site will be available at: https://$github_username.github.io/$repo_name/"
echo "==============================="

echo ""
echo "Don't forget to update the README.md with the correct GitHub Pages URL once deployed!"
