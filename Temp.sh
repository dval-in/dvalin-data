#!/bin/bash

# Function to remove trailing 's'
remove_trailing_s() {
    echo "${1%?}"
}

# Function to replace specific directory names
replace_specific_names() {
    case "$1" in
        "Achievement") echo "AchievementCategory" ;;
        "TcgAction") echo "TCGActionCard" ;;
        "TcgCharacter") echo "TCGCharacterCard" ;;
        "TcgMonster") echo "TCGMonsterCard" ;;
        *) echo "$1" ;;
    esac
}

# Function to rename directories based on the specified rules
rename_dirs() {
    local current_dir="$1"
    for entry in "$current_dir"/*; do
        if [ -d "$entry" ]; then
            # Recurse into the directory first to rename subdirectories
            rename_dirs "$entry"
        fi
    done

    # Renaming the current directory if it's not the initial directory
    if [ "$current_dir" != "$2" ]; then
        local base_dir=$(dirname "$current_dir")
        local dir_name=$(basename "$current_dir")
        local new_name="$dir_name"

        # Remove trailing 's'
        if [ "${dir_name: -1}" == "s" ]; then
            new_name=$(remove_trailing_s "$new_name")
        fi

        # Replace specific names
        new_name=$(replace_specific_names "$new_name")

        mv -v "$current_dir" "$base_dir/$new_name"
    fi
}

# Call the function on the specified directory
initial_dir=$(realpath "$1")
rename_dirs "$initial_dir" "$initial_dir"
