#!/bin/bash
set -e
cat > config.js << EOF
const SUPABASE_URL = "${SUPABASE_URL}";
const SUPABASE_KEY = "${SUPABASE_KEY}";
const FORMSPREE_ENDPOINT = "${FORMSPREE_ENDPOINT}";
EOF
