from flask_sqlalchemy import SQLAlchemy
from flask import Flask

def create_app():
    app=Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///database.sqlite3'
    db=SQLAlchemy()
    db.init_app(app)
    return app,db
    
app,db=create_app()
from controllers.cotrollers import *

if __name__=='__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)