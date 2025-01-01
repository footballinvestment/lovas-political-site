#!/bin/bash

# Fájlnevek
LOG_FILE="test_results_$(date +%Y%m%d_%H%M%S).log"
HTML_REPORT="test_report_$(date +%Y%m%d_%H%M%S).html"

# Számolók
PASSED=0
FAILED=0

# API URL
API_URL="http://localhost:3000/api"

# Log funkció
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Teszt funkció
run_test() {
    local name=$1
    local command=$2
    
    log "Teszt: $name ..."
    
    if eval $command > /dev/null 2>&1; then
        log "✓ Sikeres - $name"
        ((PASSED++))
        return 0
    else
        log "✗ Sikertelen - $name"
        ((FAILED++))
        return 1
    fi
}

# Tesztek kezdése
log "=== Bejegyzéskezelő Rendszer Tesztek ==="
log "Dátum: $(date)"
log ""

# 1. Környezet tesztek
log "1. Környezet ellenőrzése"
run_test "Node.js verzió ellenőrzése" "node -v"
run_test "NPM verzió ellenőrzése" "npm -v"
run_test "Next.js szerver fut" "curl -s http://localhost:3000 > /dev/null"

# 2. API tesztek
log "\n2. API Tesztek"

# Bejegyzés létrehozása
TEST_POST_DATA='{
    "title": "Teszt Bejegyzés",
    "content": "Ez egy teszt tartalom",
    "status": "DRAFT"
}'

log "Bejegyzés létrehozása..."
RESPONSE=$(curl -s -X POST "$API_URL/posts" \
    -H "Content-Type: application/json" \
    -d "$TEST_POST_DATA")

POST_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$POST_ID" ]; then
    log "✓ Bejegyzés létrehozva (ID: $POST_ID)"
    ((PASSED++))
    
    # Bejegyzés lekérése
    run_test "Bejegyzés lekérése" "curl -s $API_URL/posts/$POST_ID | grep 'Teszt Bejegyzés'"
    
    # Bejegyzés módosítása
    run_test "Bejegyzés módosítása" "curl -s -X PATCH $API_URL/posts/$POST_ID \
        -H 'Content-Type: application/json' \
        -d '{\"title\":\"Módosított Teszt\"}'"
        
    # Bejegyzés törlése
    run_test "Bejegyzés törlése" "curl -s -X DELETE $API_URL/posts/$POST_ID"
else
    log "✗ Nem sikerült létrehozni a bejegyzést"
    ((FAILED++))
fi

# 3. HTML jelentés generálása
cat > "$HTML_REPORT" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>Teszt Eredmények</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 0 20px; }
        .success { color: green; }
        .failure { color: red; }
        .header { background: #f5f5f5; padding: 10px; margin: 20px 0; }
        .result { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Teszt Eredmények</h1>
        <p>Dátum: $(date)</p>
        <p>Sikeres tesztek: <span class='success'>$PASSED</span></p>
        <p>Sikertelen tesztek: <span class='failure'>$FAILED</span></p>
    </div>
    <div class='results'>
EOL

# Log tartalom hozzáadása a HTML-hez
while IFS= read -r line; do
    if [[ $line == *"✓"* ]]; then
        echo "<div class='result success'>$line</div>" >> "$HTML_REPORT"
    elif [[ $line == *"✗"* ]]; then
        echo "<div class='result failure'>$line</div>" >> "$HTML_REPORT"
    else
        echo "<div class='result'>$line</div>" >> "$HTML_REPORT"
    fi
done < "$LOG_FILE"

# HTML lezárása
echo "</div></body></html>" >> "$HTML_REPORT"

# Összegzés
log "\n=== Teszt Összegzés ==="
log "Sikeres tesztek: $PASSED"
log "Sikertelen tesztek: $FAILED"
log "Log fájl: $LOG_FILE"
log "HTML jelentés: $HTML_REPORT"

# Kilépés megfelelő státuszkóddal
[ $FAILED -eq 0 ] && exit 0 || exit 1