from flask import render_template, redirect, url_for
from models.models import *
from main import app

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/home')
def home():
    return render_template('index.html')