# ShanghaiTech-Mail-TOTP

Use 3rd TOTP apps instead of Coremail to login ShanghaiTech Mail.

使用第三方验证器代替 Coremail 论客的 TOTP 动态密码来登录上海科技大学邮箱。

> [!Warning]
> **注意**
> 本项目不是官方脚本，不保证接口等长久可用。
> 在添加 TOTP 验证前，请务必确保**你已经添加至少一种可用的备选验证方案**！
> 这是因为添加的验证器不会与 Coremail 绑定，故无法通过 APP 验证的方式找回。如需要通过验证器验证，请选择验证码并输入动态密码，或者使用短信、备用邮箱等验证方案。

欢迎 Star~

## Setup & Usage

1. 安装前，请确保你的浏览器已经安装了 [Tampermonkey（油猴）](https://www.tampermonkey.net/) 插件
2. 点击 [这个链接](https://github.com/ShanghaitechGeekPie/ShanghaiTech-Mail-TOTP/raw/refs/heads/main/shtu-mail-totp.user.js) 安装脚本
3. 进入邮箱的设置页面，选择安全设置、二次验证设置，绑定 【Coremail 论客 App】
4. 此时如果窗口提示你绑定第三方 TOTP 应用，说明安装成功，按照指示扫码验证即可。

## FAQ

TBD

## License

基于 MIT 协议开源。
