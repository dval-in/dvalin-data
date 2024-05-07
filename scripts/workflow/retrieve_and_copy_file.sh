#!/bin/bash

# Define the base directory for the repository and target directory
REPO_DIR="genshin-data"
TARGET_DIR="../../dvalin-data/workflowtest"

# Clone the repository
git clone https://github.com/dvaJi/genshin-data.git "$REPO_DIR"
cd "$REPO_DIR"

# Assume COMMITS is a newline-separated string of commit hashes
IFS=$'\n' read -r -d '' -a COMMIT_ARRAY <<< "$COMMITS"

# Ensure the target directory exists
mkdir -p "$TARGET_DIR"

# Loop through all commits in the COMMIT_ARRAY
for COMMIT in "${COMMIT_ARRAY[@]}"; do
    # Get all changed files in this commit
    CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r $COMMIT)
    
    # Loop through each file and check if it starts with 'src/data'
    for FILE in $CHANGED_FILES; do
        if [[ $FILE == src/data/* ]]; then
            # Calculate full source path
            SRC_PATH="./$FILE"
            
            # Calculate destination path, preserving the directory structure within 'workflowtest'
            DEST_PATH="$TARGET_DIR/${FILE#src/data/}"

            # Create directory structure in target if not exists
            mkdir -p "$(dirname "$DEST_PATH")"
            
            # Copy the file to the target directory
            cp "$SRC_PATH" "$DEST_PATH"
        fi
    done
done
