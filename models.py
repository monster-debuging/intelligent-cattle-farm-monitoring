from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255)) # 存储密码哈希值，可为空（如果仅用验证码登录）
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username} ({self.email})>'

# 可选：创建一个单独的表来存储验证码及其过期时间，或者在 session 中存储
# 这里简化处理，在内存 session 中存储验证码和过期时间
# class VerificationCode(db.Model): # 如果需要持久化存储验证码
#     __tablename__ = 'verification_codes'
#     id = db.Column(db.Integer, primary_key=True)
#     email = db.Column(db.String(120), unique=True, nullable=False)
#     code = db.Column(db.String(6), nullable=False)
#     expires_at = db.Column(db.DateTime, nullable=False)
#     purpose = db.Column(db.String(20), nullable=False) # 'register' or 'login'