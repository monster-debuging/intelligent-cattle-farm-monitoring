# # check_db.py
# from app import app, db, User
#
# # 确保在应用上下文中运行
# with app.app_context():
#     # 查看所有用户
#     users = User.query.all()
#     print("所有用户:")
#     for user in users:
#         print(f"ID: {user.id}, 用户名: {user.username}, 密码哈希: {user.password}")
#
#     # 查看第一个用户
#     if users:
#         print("\n第一个用户:")
#         print(f"ID: {users[0].id}, 用户名: {users[0].username}")



# check_db.py
from app import create_app
from models import User

# 创建应用实例
app = create_app()

# 在应用上下文中运行
with app.app_context():
    # 查看所有用户
    users = User.query.all()
    print("所有用户:")
    for user in users:
        print(f"ID: {user.id}, 用户名: {user.username}, 邮箱: {user.email}")