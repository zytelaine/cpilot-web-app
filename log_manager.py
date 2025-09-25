# log_manager.py
import time
import json
from PIL import Image

CPILOT_ROOM = "cPilot"

def filter_image_objects(data):
    """递归过滤掉数据中所有的Image对象"""
    if isinstance(data, dict):
        # 过滤字典中的Image值，并递归处理其他值
        return {k: filter_image_objects(v) for k, v in data.items() 
                if not isinstance(v, Image.Image)}
    elif isinstance(data, list):
        # 过滤列表中的Image元素，并递归处理其他元素
        return [filter_image_objects(item) for item in data 
                if not isinstance(item, Image.Image)]
    elif isinstance(data, tuple):
        # 处理元组类型
        return tuple(filter_image_objects(item) for item in data 
                    if not isinstance(item, Image.Image))
    else:
        # 非容器类型直接返回
        return data


class LogManager:
    """日志管理类，提供统一的日志接口"""
    def __init__(self, sio_instance=None):
        self.sio = sio_instance
        self.log_levels = ['debug', 'info', 'warning', 'error', 'critical']
        
    def set_sio(self, sio_instance):
        """设置SocketIO实例"""
        self.sio = sio_instance
        
    def send_log(self, sid, log_data, level='info', to_room=False):
        """发送日志到客户端，可以选择发送到指定客户端或房间"""
        if not self.sio:
            return
            
        if level not in self.log_levels:
            level = 'info'
            
        # 标准化日志格式
        if isinstance(log_data, str):
            log_info = {
                'message': log_data,
                'level': level,
                'timestamp': time.time()
            }
        else:
            log_info = {**log_data, 'level': level, 'timestamp': time.time()}
        
        filtered_data = filter_image_objects(log_data)

        if to_room:
            self.sio.emit('cPilot_log', filtered_data, room=CPILOT_ROOM)
        else:
            self.sio.emit('cPilot_log', filtered_data, room=sid)
        
    # 快捷方法
    def info(self, sid, message, to_room=False):
        self.send_log(sid, message, 'info', to_room)
        
    def warning(self, sid, message, to_room=False):
        self.send_log(sid, message, 'warning', to_room)
        
    def error(self, sid, message, to_room=False):
        self.send_log(sid, message, 'error', to_room)
        
    def debug(self, sid, message, to_room=False):
        self.send_log(sid, message, 'debug', to_room)

# 全局单例实例
log_manager = LogManager()