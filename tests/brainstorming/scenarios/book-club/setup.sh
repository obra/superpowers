# Fixture: a small Flask + SQLite + Jinja book club site. Run with cwd = the scenario's work dir.
mkdir -p templates
cat > app.py <<'PY'
import sqlite3
from flask import Flask, g, redirect, render_template, request, session, url_for

app = Flask(__name__)
app.secret_key = "dev"
DB = "club.db"

def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(_):
    if "db" in g:
        g.db.close()

@app.route("/")
def home():
    books = db().execute("SELECT * FROM books ORDER BY read_on DESC").fetchall()
    return render_template("home.html", books=books, member=session.get("member"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        row = db().execute("SELECT name FROM members WHERE code = ?", (request.form["code"],)).fetchone()
        if row:
            session["member"] = row["name"]
            return redirect(url_for("home"))
    return render_template("login.html")

@app.route("/meetings")
def meetings():
    rows = db().execute("SELECT * FROM meetings ORDER BY held_on DESC").fetchall()
    return render_template("meetings.html", meetings=rows, member=session.get("member"))
PY
cat > schema.sql <<'SQL'
CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE);
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT, read_on DATE);
CREATE TABLE meetings (id INTEGER PRIMARY KEY, held_on DATE NOT NULL, book_id INTEGER REFERENCES books(id), notes TEXT);
SQL
cat > templates/base.html <<'HTML'
<!doctype html><html><head><title>Fern Street Book Club</title><link rel="stylesheet" href="/static/club.css"></head>
<body><nav><a href="/">Books</a> <a href="/meetings">Meetings</a>{% if member %} · hi {{ member }}{% endif %}</nav>{% block body %}{% endblock %}</body></html>
HTML
cat > templates/home.html <<'HTML'
{% extends "base.html" %}{% block body %}<h1>What we've read</h1><ul>{% for b in books %}<li>{{ b.title }} by {{ b.author }}</li>{% endfor %}</ul>{% endblock %}
HTML
cat > templates/login.html <<'HTML'
{% extends "base.html" %}{% block body %}<form method="post"><input name="code" placeholder="member code"><button>Log in</button></form>{% endblock %}
HTML
cat > templates/meetings.html <<'HTML'
{% extends "base.html" %}{% block body %}<h1>Meetings</h1><ul>{% for m in meetings %}<li>{{ m.held_on }}: {{ m.notes }}</li>{% endfor %}</ul>{% endblock %}
HTML
cat > requirements.txt <<'TXT'
flask==3.1.*
TXT
cat > README.md <<'MD'
# Fern Street Book Club

Our club's little website. `pip install -r requirements.txt`, `sqlite3 club.db < schema.sql`, `flask run`.
Members log in with the code Sam hands out.
MD
git add -A && git -c user.email=t@t -c user.name=t commit -qm "book club site"
