from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from models import db, User
from utils import generate_verification_code, send_verification_email
from config import Config
from werkzeug.security import generate_password_hash, check_password_hash
import time

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    with app.app_context():
        db.create_all() # 创建数据库表

    # --- API 路由 ---

    @app.route('/api/send_code', methods=['POST'])
    def send_code():
        data = request.get_json()
        email = data.get('email')
        purpose = data.get('purpose', 'login') # 'login' 或 'register'

        if not email:
            return jsonify({'success': False, 'message': '缺少邮箱地址'}), 400

        # 检查用户是否存在（针对不同目的）
        user = User.query.filter_by(email=email).first()
        if purpose == 'register' and user:
            return jsonify({'success': False, 'message': '该邮箱已被注册'}), 400
        if purpose == 'login' and not user:
            return jsonify({'success': False, 'message': '该邮箱未注册'}), 400

        # 生成验证码
        code = generate_verification_code()
        # 将验证码存入 session (简化处理，生产环境建议存入 Redis 或数据库)
        session[f'verify_code_{email}_{purpose}'] = {
            'code': code,
            'expires_at': time.time() + app.config['CODE_EXPIRATION_TIME']
        }

        # 发送邮件
        success = send_verification_email(email, code, purpose)
        if success:
            return jsonify({'success': True, 'message': '验证码已发送至您的邮箱'})
        else:
            return jsonify({'success': False, 'message': '验证码发送失败，请稍后再试'}), 500

    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        code = data.get('code')

        # 基本校验
        if not all([username, email, password, confirm_password, code]):
            return jsonify({'success': False, 'message': '请填写所有必填项'}), 400

        if password != confirm_password:
            return jsonify({'success': False, 'message': '两次输入的密码不一致'}), 400

        # 检查用户是否已存在
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': '该邮箱已被注册'}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': '用户名已被占用'}), 400

        # 验证验证码
        session_key = f'verify_code_{email}_register'
        stored_data = session.get(session_key)
        if not stored_data or time.time() > stored_data['expires_at']:
            return jsonify({'success': False, 'message': '验证码无效或已过期'}), 400
        if stored_data['code'] != code:
             return jsonify({'success': False, 'message': '验证码错误'}), 400

        # 创建新用户
        hashed_password = generate_password_hash(password)
        new_user = User(username=username, email=email, password_hash=hashed_password)
        try:
            db.session.add(new_user)
            db.session.commit()
            # 注册成功后清除验证码 session
            session.pop(session_key, None)
            return jsonify({'success': True, 'message': '注册成功！'})
        except Exception as e:
            db.session.rollback()
            print(f"Database error during registration: {e}")
            return jsonify({'success': False, 'message': '注册失败，请稍后再试'}), 500


    @app.route('/api/login', methods=['POST'])
    def login():
         data = request.get_json()
         email = data.get('email')
         password = data.get('password', '') # 密码可能为空（验证码登录）
         code = data.get('code', '') # 验证码可能为空（密码登录）
         login_type = data.get('type', 'password') # 'password' or 'code'

         if not email:
             return jsonify({'success': False, 'message': '请输入邮箱'}), 400

         user = User.query.filter_by(email=email).first()
         if not user:
             return jsonify({'success': False, 'message': '该邮箱未注册'}), 400

         if login_type == 'password':
             if not password:
                 return jsonify({'success': False, 'message': '请输入密码'}), 400
             if check_password_hash(user.password_hash, password):
                 session['user_id'] = user.id
                 session['username'] = user.username
                 return jsonify({'success': True, 'message': '登录成功！', 'redirect_url': '/index.html'}) # 返回重定向URL
             else:
                 return jsonify({'success': False, 'message': '密码错误'}), 400

         elif login_type == 'code':
             if not code:
                 return jsonify({'success': False, 'message': '请输入验证码'}), 400
             # 验证验证码
             session_key = f'verify_code_{email}_login'
             stored_data = session.get(session_key)
             if not stored_data or time.time() > stored_data['expires_at']:
                 return jsonify({'success': False, 'message': '验证码无效或已过期'}), 400
             if stored_data['code'] != code:
                  return jsonify({'success': False, 'message': '验证码错误'}), 400

             # 验证码正确，登录成功
             session['user_id'] = user.id
             session['username'] = user.username
             # 登录成功后清除验证码 session
             session.pop(session_key, None)
             return jsonify({'success': True, 'message': '登录成功！', 'redirect_url': '/index.html'})

         else:
             return jsonify({'success': False, 'message': '无效的登录类型'}), 400

    @app.route('/api/logout', methods=['POST'])
    def logout():
        session.clear() # 清除所有 session 数据
        return jsonify({'success': True, 'message': '已退出登录'})

    @app.route('/api/user_info')
    def get_user_info():
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        user = User.query.get(user_id)
        if user:
            return jsonify({
                'success': True,
                'data': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return jsonify({'success': False, 'message': '用户不存在'}), 404

    # --- 页面路由 ---
    @app.route('/')
    def home():
        # 检查是否已登录
        if 'user_id' in session:
            return redirect(url_for('dashboard'))
        return render_template('log.html') # 显示登录/注册页面

    @app.route('/log.html')
    def login_page():
        return render_template('log.html')

    @app.route('/index.html')
    def dashboard():
        # 检查是否已登录
        if 'user_id' not in session:
            return redirect(url_for('home'))
        return render_template('index.html')

    @app.route('/cow_info.html')
    def cow_info():
        # 检查是否已登录
        if 'user_id' not in session:
            return redirect(url_for('home'))
        return render_template('cow_info.html')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True) # 开发环境下启用 debug，生产环境应关闭