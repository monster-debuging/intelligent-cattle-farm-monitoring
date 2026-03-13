import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from flask import current_app


def generate_verification_code(length=6):
    """生成指定长度的数字验证码"""
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(recipient_email, verification_code, purpose='login'):
    """
    发送验证码邮件
    :param recipient_email: 收件人邮箱
    :param verification_code: 验证码
    :param purpose: 验证码用途 ('login', 'register')
    """
    try:
        msg = MIMEMultipart()

        # 获取发件人信息
        sender_name, sender_email = current_app.config['MAIL_DEFAULT_SENDER']

        # --- 关键修改：正确处理中文昵称 ---
        # 如果昵称包含中文，使用 Base64 编码
        if not sender_name.isascii():
            # 使用 email.header 模块进行编码
            encoded_name = Header(sender_name, 'utf-8').encode()
            msg['From'] = f'{encoded_name} <{sender_email}>'
        else:
            msg['From'] = f'"{sender_name}" <{sender_email}>'
        # ---

        msg['To'] = recipient_email

        if purpose == 'register':
            msg['Subject'] = "【牛场监测系统】注册验证码"
            body = f"您好！感谢您注册牛场监测系统。\n您的注册验证码是: {verification_code}\n验证码将在 {current_app.config['CODE_EXPIRATION_TIME'] // 60} 分钟后失效，请尽快完成注册。"
        else:  # 默认为 login
            msg['Subject'] = "【牛场监测系统】登录验证码"
            body = f"您好！您的登录验证码是: {verification_code}\n验证码将在 {current_app.config['CODE_EXPIRATION_TIME'] // 60} 分钟后失效，请勿泄露给他人。"

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # 根据配置决定使用 SSL 还是 TLS
        if current_app.config.get('MAIL_USE_SSL', False):
            server = smtplib.SMTP_SSL(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        else:
            server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
            server.starttls()  # 启用 TLS 加密

        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        text = msg.as_string()
        server.sendmail(current_app.config['MAIL_USERNAME'], recipient_email, text)
        server.quit()
        print(f"Verification code sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
