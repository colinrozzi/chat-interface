#!/bin/bash
# Script to clean up old JavaScript files after TypeScript conversion

echo "Cleaning up JavaScript files..."

# Move to src directory
cd src

# Backup JavaScript files before removing them
echo "Creating backups of JavaScript files..."
mkdir -p ../js-backup
cp *.js ../js-backup/

# Remove JavaScript files that have TypeScript equivalents
for jsfile in *.js; do
  tsfile="${jsfile%.js}.ts"
  if [ -f "$tsfile" ]; then
    echo "Removing $jsfile (TypeScript version exists)"
    rm "$jsfile"
  else
    echo "Keeping $jsfile (no TypeScript version found)"
  fi
done

echo "Cleanup complete!"
echo "JavaScript backups are in the js-backup directory if needed."
