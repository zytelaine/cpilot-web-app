本项目暂时使用cPilot_v1 与cPilot_v1位于同级目录 ./copy下的文件需手动拷贝至cPilot_v1中

# 安装依赖（首次运行）
cd .../cpilot-web-app
npm install

# 前端启动方法：
cd .../cpilot-web-app
npm run dev

# 启动开发服务器
后端启动方法： python -m cpilot-web-app.cPilot_local_server

# 预留服务端向客户端发送信息API：

import importlib 

cpilot_local_server = importlib.import_module("cpilot-web-app.cPilot_local_server") 

log_manager = cpilot_local_server.log_manager

log_manager.info(None, {"assistant":your_message}, True)
