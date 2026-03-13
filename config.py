# import os
#
# class Config:
#     # 数据库配置
#     basedir = os.path.abspath(os.path.dirname(__file__))
#     SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "instance", "database.db")}'
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#
#     # 邮件配置 (以 QQ 邮箱为例，请替换为您的实际信息)
#     MAIL_SERVER = 'smtp.qq.com'
#     MAIL_PORT = 587 # TLS 端口
#     MAIL_USE_TLS = True
#     # MAIL_USE_SSL = True # 如果使用 SSL，则启用此项并禁用 TLS
#     MAIL_USERNAME = '3407663203@qq.com' # 替换为你的QQ邮箱
#     MAIL_PASSWORD = 'bzhwxloflckidaba' # 替换为你的QQ邮箱授权码，不是登录密码
#     MAIL_DEFAULT_SENDER = ('牛场监测系统', MAIL_USERNAME) # 发件人名称和邮箱
#
#     # 其他配置
#     SECRET_KEY = '           ' # 用于会话加密
#     CODE_EXPIRATION_TIME = 300 # 验证码过期时间 (秒), 5分钟




# config.py
import os

class Config:
    # 数据库配置
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "instance", "database.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 邮件配置 (以 QQ 邮箱为例，请替换为您的实际信息)
    MAIL_SERVER = 'smtp.qq.com'
    MAIL_PORT = 465  # SSL 端口
    MAIL_USE_TLS = False  # 禁用 TLS
    MAIL_USE_SSL = True   # 启用 SSL
    MAIL_USERNAME = '3407663203@qq.com' # 替换为你的QQ邮箱
    MAIL_PASSWORD = 'bzhwxloflckidaba' # 替换为你的QQ邮箱授权码，不是登录密码
    MAIL_DEFAULT_SENDER = ('牛场监测系统', MAIL_USERNAME) # 发件人名称和邮箱

    # 其他配置
    SECRET_KEY = '           ' # 用于会话加密
    CODE_EXPIRATION_TIME = 300 # 验证码过期时间 (秒), 5分钟