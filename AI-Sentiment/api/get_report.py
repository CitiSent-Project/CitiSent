from flask import Blueprint, request, jsonify
from ai import reports_db

get_report_bp = Blueprint('get_report', __name__)

@get_report_bp.route('/report', methods=['GET'])
def get_report():
    """
    GET /report
    Retrieve all submitted citizen reports, with optional priority filter.

    Query Parameters:
        priority (optional): Filter by priority level.
                             Valid values: CRITICAL, HIGH, MEDIUM, LOW

    Examples:
        GET /report                      -> Returns all reports
        GET /report?priority=CRITICAL    -> Returns only CRITICAL reports
        GET /report?priority=LOW         -> Returns only LOW priority reports

    Returns:
    {
        "total": 2,
        "reports": [
            {
                "id": 1,
                "text": "There is a fire in the building!",
                "label": "LABEL_0",
                "priority": "CRITICAL",
                "confidence": 0.9821
            },
            ...
        ]
    }
    """
    priority_filter = request.args.get('priority', '').upper()

    if priority_filter:
        valid_priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        if priority_filter not in valid_priorities:
            return jsonify({
                'error': f'Invalid priority filter. Valid options: {valid_priorities}'
            }), 400

        filtered = [r for r in reports_db if r['priority'] == priority_filter]
    else:
        filtered = reports_db

    return jsonify({
        'total': len(filtered),
        'reports': filtered
    }), 200