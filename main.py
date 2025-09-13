from flask_sqlalchemy import SQLAlchemy
from flask import Flask
import os
def create_app():
    app=Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///database.sqlite3'
    app.config['SECRET_KEY']="mykey"
    app.config['UPLOAD_FOLDER']='static/uploads'
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    db=SQLAlchemy()
    db.init_app(app)
    return app,db
    
app,db=create_app()
from controllers.cotrollers import *

if __name__=='__main__':
    with app.app_context():
        db.create_all()
    app.run()
