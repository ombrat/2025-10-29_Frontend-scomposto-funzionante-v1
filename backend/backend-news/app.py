from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime
import logging
from dotenv import load_dotenv

# Carica variabili d'ambiente da .env
load_dotenv()

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configurazione
ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY', 'M768ALQQ3JVUXCGC')  # API key configurata come fallback
ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'

# Log della configurazione per verifica
logger.info(f"🔑 Alpha Vantage API Key: {ALPHA_VANTAGE_API_KEY[:8]}...{ALPHA_VANTAGE_API_KEY[-4:]} (mostrati solo primi 8 e ultimi 4 caratteri)")
logger.info(f"📊 API Key Status: {'CONFIGURATA' if ALPHA_VANTAGE_API_KEY != 'demo' else 'DEMO (NON VALIDA)'}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Alpha Vantage News API Proxy',
        'timestamp': datetime.now().isoformat(),
        'alpha_vantage_key_configured': ALPHA_VANTAGE_API_KEY != 'demo'
    })

@app.route('/news', methods=['GET'])
@app.route('/api/news', methods=['GET'])
def get_news():
    """
    Proxy per Alpha Vantage News API
    Parametri supportati:
    - tickers: lista di ticker separati da virgola (default: principali US stocks)
    - topics: lista di topics separati da virgola  
    - limit: numero massimo di articoli (default: 10)
    """
    try:
        # Parametri di default
        default_tickers = 'NVDA,TSLA,AAPL,MSFT,GOOGL,AMZN,META,BTC,ETH,SPY,QQQ'
        default_topics = 'financial_markets,earnings,ipo,mergers_and_acquisitions,technology'
        
        # Estrai parametri dalla query
        tickers = request.args.get('tickers', default_tickers)
        topics = request.args.get('topics', default_topics)
        limit = request.args.get('limit', '10')
        
        # Parametri per Alpha Vantage
        params = {
            'function': 'NEWS_SENTIMENT',
            'tickers': tickers,
            'topics': topics,
            'limit': limit,
            'apikey': ALPHA_VANTAGE_API_KEY
        }
        
        logger.info(f"Calling Alpha Vantage API with tickers: {tickers}")
        
        # Chiamata all'API
        response = requests.get(ALPHA_VANTAGE_BASE_URL, params=params, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"Alpha Vantage API error: {response.status_code}")
            return jsonify({'error': f'API error: {response.status_code}'}), response.status_code
        
        data = response.json()
        
        # Controlla se ci sono errori nell'API
        if 'Error Message' in data:
            logger.error(f"Alpha Vantage API error: {data['Error Message']}")
            return jsonify({'error': data['Error Message']}), 400
        
        if 'Note' in data:
            logger.warning(f"Alpha Vantage API note: {data['Note']}")
            return jsonify({'error': data['Note']}), 429
        
        # Ritorna i dati
        logger.info(f"Successfully fetched {len(data.get('feed', []))} news articles")
        return jsonify(data)
        
    except requests.exceptions.Timeout:
        logger.error("Alpha Vantage API timeout")
        return jsonify({'error': 'API timeout'}), 504
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return jsonify({'error': 'Request failed'}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/news/test', methods=['GET'])
@app.route('/api/news/test', methods=['GET'])
def test_news():
    """Endpoint di test con dati di esempio"""
    test_data = {
        'feed': [
            {
                'title': 'Test Article 1',
                'summary': 'This is a test article for the news API proxy',
                'source': 'Test Source',
                'time_published': '20251104T160000',
                'url': 'https://example.com/test1',
                'overall_sentiment_score': 0.5,
                'overall_sentiment_label': 'Neutral'
            },
            {
                'title': 'Test Article 2', 
                'summary': 'Another test article for verification',
                'source': 'Test Source 2',
                'time_published': '20251104T150000',
                'url': 'https://example.com/test2',
                'overall_sentiment_score': 0.7,
                'overall_sentiment_label': 'Positive'
            }
        ],
        'sentiment_score_definition': 'x <= -0.35: Bearish; -0.35 < x <= -0.15: Somewhat-Bearish; -0.15 < x < 0.15: Neutral; 0.15 <= x < 0.35: Somewhat_Bullish; x >= 0.35: Bullish'
    }
    
    logger.info("Returning test news data")
    return jsonify(test_data)

if __name__ == '__main__':
    logger.info("Starting Alpha Vantage News API Proxy on port 8001")
    logger.info(f"API Key configured: {'Yes' if ALPHA_VANTAGE_API_KEY != 'demo' else 'No (using demo)'}")
    app.run(host='0.0.0.0', port=8001, debug=True)
