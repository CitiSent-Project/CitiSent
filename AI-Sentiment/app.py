from flask import Flask
from api.post_report import post_report_bp
from api.get_report import get_report_bp

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(post_report_bp)
app.register_blueprint(get_report_bp)

if __name__ == '__main__':
    app.run(debug=True)