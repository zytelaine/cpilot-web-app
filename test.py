import redis
from celery import Celery
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secretkey'
socketio = SocketIO(app)

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

redis_conn = redis.Redis(host='localhost', port=6379)

@socketio.on('connect', namespace='/test')
def test_connect():
    print('Client connected!')

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected!')

@celery_app.task
def background_task():
    # 执行一些耗时的后台任务
    # ...

    # 完成任务后，将消息发布到Redis队列
    redis_conn.publish('background_completed', 'Task completed')

@app.route('/')
def index():
    return "Hello, World!"

@socketio.on('background_completed', namespace='/test')
def handle_background_completed(msg):
    # 当接收到消息时，发送给客户端
    socketio.emit('background_completed', msg, namespace='/test', broadcast=True)

@app.route('/start_task')
def start_task():
    # 启动后台任务
    background_task.delay()
    return "Task started!"

if __name__ == '__main__':
    socketio.run(app)