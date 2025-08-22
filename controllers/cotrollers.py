from flask import render_template, redirect, url_for, session, request
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
        cat=request.form.get('category')
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
    
@app.route('/report', methods=['GET','POST'])
def report():
    if request.method=='POST':
        title=request.form['title']
        lat=request.form['lat']
        long=request.form['lng']
        desc=request.form['desc']
        cat=request.form['cat']
        stat=request.form['stat']
        email=request.form['email']
        time=request.form['time']
        file=request.files['photo']


@app.route('/home')
def home():
    tu=User.query.filter_by(id=session['id']).first()
    return render_template('index.html', this_user=tu)