#!/bin/bash

# Load .env file and export variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Start server
cd server && npm run dev
