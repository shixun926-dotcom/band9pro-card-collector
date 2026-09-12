# 官方 SDK 接入检查表

拿到小米手环 9 Pro 对应快应用 SDK 后，先确认以下事项：

1. 包格式、构建命令和模拟器版本。
2. `manifest.json` 的准确字段、权限声明和页面注册格式。
3. `.ux` 页面生命周期、路由参数传递方式和返回行为。
4. `@system.storage` 的读取、写入、失败回调签名。
5. 本地资源和远程图片路径规则。
6. 网络请求、域名白名单和 HTTPS 要求。
7. 步数、运动时长、热量等健康数据是否可在快应用内读取。
8. 后台运行、跨天刷新和通知能力是否存在。
9. 屏幕安全区、圆角和系统导航区域尺寸。
10. 真机安装限制、调试证书和发布审核要求。

页面层只需要替换平台适配代码，`app/core/game.js` 的玩法规则可以保持不变。

## 已确认的 AIoT-IDE 环境

- AIoT-IDE：`D:\Develop\AIoT IDE`
- 可执行文件：`D:\Develop\AIoT IDE\AIoT IDE.exe`
- 命令行入口：`D:\Develop\AIoT IDE\bin\aiot-ide.cmd`
- 应用版本信息：AIoT IDE `1.7.0`
- 官方项目源码目录：`src/`
- 构建输出目录：AIoT-IDE 通常生成 `dist/` 和 `build/`
