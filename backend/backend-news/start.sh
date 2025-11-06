#!/bin/bash

echo "🗞️  Avvio Backend News (Alpha Vantage API Proxy)..."

# Installa le dipendenze se necessario
if [ ! -f "venv/bin/activate" ]; then
    echo "Creazione virtual environment..."
    python3 -m venv venv
fi

# Attiva virtual environment
source venv/bin/activate

# Installa dipendenze
echo "Installazione dipendenze..."
pip install -q -r requirements.txt

# Verifica se esiste file .env
if [ ! -f ".env" ]; then
    echo "⚠️  File .env non trovato. Creazione file di esempio..."
    cat > .env << EOF
ALPHA_VANTAGE_API_KEY=demo
EOF
    echo "📝 Modifica il file .env con la tua API key di Alpha Vantage"
fi

# Carica variabili ambiente
export $(cat .env | xargs)

echo "🚀 Avvio server su porta 8001..."
python3 app.py
