本项目暂时使用cPilot_v1
与cPilot_v1位于同级目录
./copy下的文件需手动拷贝至cPilot_v1中


预留服务端向客户端发送信息API：

import importlib
# 动态导入包含横杠的模块
cpilot_local_server = importlib.import_module("cpilot-web-app.cPilot_local_server")
log_manager = cpilot_local_server.log_manager

log_manager.info(None, {"assistant":your_message}, True)
