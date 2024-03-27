#!/bin/zsh

# Start the JSON object
echo "{"

# Initialize a variable to manage commas between JSON elements
first=1

# Loop through each item in the current directory
for dir in */ ; do
  if [[ -d $dir ]]; then
    # Remove the trailing slash to get the clean directory name
    dirname="${dir%/}"
    # Convert directory name to lowercase using tr
    lowercasename=$(echo "$dirname" | tr '[:upper:]' '[:lower:]')

    # Add a comma before the next element if it's not the first
    if [[ $first -ne 1 ]]; then
      echo ","
    else
      first=0
    fi

    # Print the JSON element without a trailing comma
    echo -n "\"$lowercasename\": \"$dirname\""
  fi
done

# Close the JSON object
echo
echo "}"
