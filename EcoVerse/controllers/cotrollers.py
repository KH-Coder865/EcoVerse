from flask import render_template, redirect, url_for, session, request, jsonify
from datetime import datetime
from models.models import *
import os
from main import app

@app.route('/', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        email=request.form['email']
        pwd=request.form['pass']
        us=User.query.filter_by(email=email).first()
        if us:
            if pwd == us.password:
                session['id']=us.id
                return redirect(url_for('home'))
            else:
                return render_template('login.html',stat='pwrng')
        else :
            return render_template('login.html', stat="udne")
    return render_template('login.html',stat='passed')


@app.route('/logout')
def logout():
    session.pop('id',None)
    return redirect(url_for('login'))
        
@app.route('/register',methods=['GET','POST'])
def register():
    if request.method == 'POST':
        name=request.form['name']
        email=request.form['email']
        pwd=request.form['pass']
        cat=request.form.get('cat')
        adr=request.form.get('adr')
        mobile_no=request.form.get('mbno')
        date=datetime.utcnow()
        us=User.query.filter_by(email=email).first()
        if us:
            return render_template('register.html',stat="exist")
        nu=User(username=name, email=email, password=pwd, category=cat, address=adr, mob=mobile_no, created_at=date)
        db.session.add(nu)
        db.session.commit()
        return render_template('login.html', stat='regd')
    return render_template('register.html', stat="pasd")
    
@app.route('/showrep')
def showrep():
    tu=session['id']
    return render_template('report.html',txt=None, tu=tu)

@app.route('/addreport', methods=['GET','POST'])
def addreport():
    tu=session['id']
    if request.method=='POST':
        email=User.query.filter_by(id=session['id']).first().email
        title=request.form['title']
        lat=request.form['lat']
        long=request.form['lng']
        desc=request.form['desc']
        cat=request.form['cat']
        ct=cat
        time=datetime.utcnow()
        file=request.files['photo']
        if 'photo' not in request.files:
            return "No file part", 400
    
        if file.filename == '':
            return "No selected file", 400

        filename = file.filename  
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        rep=Report(title=title, description=desc, category=ct, reporter_email=email, fpath=filepath, fname=filename, status='new', created_at=time, lat=lat, lng=long)
        db.session.add(rep)
        db.session.commit()
        return render_template('report.html',txt='Report added Successfully!', tu=tu)
    return redirect(url_for('showrep'))

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/map')
def map():
    return render_template('map.html')

@app.route('/api/reports/verified')
def verified_reports():
    reports = Report.query.filter_by(status="verified").all()
    return jsonify([
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "lat": r.lat,
            "lng": r.lng,
            "fpath": r.fpath,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in reports
    ])

@app.route('/verifybef')
def verifybef():
    r = Report.query.filter(Report.status.in_(["new", "verified"])).all()
    km=User.query.all()
    d={k.email:k.username for k in km}
    g={}
    for rt in r:
        g[rt.reporter_email]=d[rt.reporter_email]
    return render_template('verify.html',rows=r,g=g)

@app.route('/verifybef/<int:rid>')
def vbefr(rid):
    r=Report.query.get(rid)
    r.status='verified'
    db.session.commit()
    return redirect(url_for('verifybef'))

@app.route('/leaderboard')
def leaderboard():
    users = User.query.order_by(User.eco_points.desc()).all()
    data = [
        {"rank": idx + 1, "username": u.username, "eco_points": u.eco_points}
        for idx, u in enumerate(users)
    ]
    return render_template('leaderboard.html', leaderboard=data)

@app.route('/api/dashboard/impact')
def api_impact():
    categories = db.session.query(Report.category, db.func.count(Report.id)).group_by(Report.category).all()
    data = {cat: count for cat, count in categories}
    return jsonify(data)


@app.route('/api/dashboard/metrics')
def api_metrics():
    new_count = Report.query.filter_by(status='new').count()
    verified_count = Report.query.filter_by(status='verified').count()
    resolved_count = Report.query.filter_by(status='resolved').count()

    return jsonify({
        "new": new_count,
        "verified": verified_count,
        "resolved": resolved_count
    })


@app.route('/api/dashboard/resolution-rate')
def api_resolution_rate():
    total_reports = Report.query.count()
    resolved = Report.query.filter_by(status='resolved').count()
    resolution_rate = (resolved / total_reports * 100) if total_reports > 0 else 0
    return jsonify({"resolution_rate": resolution_rate})

@app.route('/api/leaderboard')
def api_leaderboard():
    users = User.query.order_by(User.eco_points.desc()).all()
    return jsonify([
        {"rank": idx + 1, "username": u.username, "eco_points": u.eco_points}
        for idx, u in enumerate(users)
    ])

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/verifyaft/<int:rid>', methods=['GET','POST'])
def vaftr(rid):
    if request.method == 'GET':
        print("Rendering verifyaft with rid =", rid)
        return render_template('verifyaft.html', id=rid)

    desc = request.form.get('desc')
    time = datetime.utcnow()

    if 'photos' not in request.files:
        return "No file part", 400
    file = request.files['photos']
    if file.filename == '':
        return "No selected file", 400

    filename = file.filename  
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # 🔹 Update Report status
    report = Report.query.get(rid)
    if not report:
        return "Report not found", 404
    report.status = "resolved"   # or "verified" depending on your workflow

    # 🔹 Track action claim
    km = User.query.all()
    d = {k.email: k.id for k in km}
    g = {rt.id: d[rt.reporter_email] for rt in Report.query.all()}

    rep = ActionClaim(report_id=rid, user_id=g[rid], desc=desc,
                      status='completed', fproof=filepath,
                      completed_at=time, points_awarded='20')
    db.session.add(rep)

    # 🔹 Award points to user
    user = User.query.get(g[rid])
    if user:
        user.eco_points += 20

    db.session.commit()
    return render_template("verifyaft.html", txt="🥇 Task Completed! +20 Eco-points", id=rid)
    

@app.route('/home')
def home():
    tu=User.query.filter_by(id=session['id']).first()
    rows=Report.query.filter_by(status='verified')
    return render_template('index.html', this_user=tu, rows=rows)