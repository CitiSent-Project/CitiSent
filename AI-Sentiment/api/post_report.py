from flask import Blueprint, request, jsonify
from ai import analyze_report, reports_db

post_report_bp = Blueprint('post_report', __name__)

@post_report_bp.route('/report', methods=['POST'])
def post_report():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'Missing required field: text'}), 400

    text = data['text'].strip()
    if not text:
        return jsonify({'error': 'Text cannot be empty'}), 400

    # AI does the work
    analysis = analyze_report(text)

    report = {
        'id': len(reports_db) + 1,
        'text': text,
        'priority': analysis['name'],
        'confidence': f"{analysis['confidence'] * 100:.2f}%"
    }

    reports_db.append(report)

    return jsonify(report), 201