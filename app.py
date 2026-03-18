from flask import Flask, render_template, request, jsonify, redirect, url_for
import sqlite3, os
from datetime import datetime

app = Flask(__name__)
DATABASE = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL, last_name TEXT NOT NULL,
            email TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL,
            program TEXT, message TEXT,
            age TEXT, nationality TEXT, desired_program TEXT, preferred_uni TEXT,
            submission_date TEXT NOT NULL)''')
        conn.commit()

@app.route('/')
def home(): return render_template('index.html', page='home')
@app.route('/about')
def about(): return render_template('about.html', page='about')
@app.route('/study')
def study(): return render_template('study.html', page='study')
@app.route('/apply')
def apply(): return render_template('apply.html', page='apply')
@app.route('/faq')
def faq(): return render_template('faq.html', page='faq')
@app.route('/contact')
def contact(): return render_template('contact.html', page='contact')

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json() if request.is_json else request.form
    fn  = str(data.get('first_name','')).strip()
    ln  = str(data.get('last_name','')).strip()
    em  = str(data.get('email','')).strip()
    ph  = str(data.get('phone','')).strip()
    ci  = str(data.get('city','')).strip()
    pr  = str(data.get('program','')).strip()
    mg  = str(data.get('message','')).strip()
    ag  = str(data.get('age','')).strip()
    na  = str(data.get('nationality','')).strip()
    dp  = str(data.get('desired_program','')).strip()
    pu  = str(data.get('preferred_uni','')).strip()

    if not all([fn, ln, em, ph]):
        r = {'success': False, 'message': 'Required fields missing.'}
        return (jsonify(r), 400) if request.is_json else (render_template('apply.html', page='apply', error=r['message']), 400)
    if '@' not in em:
        r = {'success': False, 'message': 'Invalid email address.'}
        return (jsonify(r), 400) if request.is_json else (render_template('apply.html', page='apply', error=r['message']), 400)
    with get_db() as conn:
        conn.execute(
            'INSERT INTO applications VALUES (NULL,?,?,?,?,?,?,?,?,?,?,?,?)',
            (fn, ln, em, ph, ci or 'N/A', pr, mg, ag, na, dp, pu, datetime.now().isoformat())
        )
        conn.commit()
    r = {'success': True, 'message': 'Registration submitted! We will contact you within 24 hours.'}
    return jsonify(r) if request.is_json else redirect(url_for('apply') + '?success=1')

@app.route('/admin/applications')
def admin_applications():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM applications ORDER BY submission_date DESC').fetchall()
    return jsonify([dict(r) for r in rows])

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
