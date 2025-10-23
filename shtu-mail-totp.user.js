// ==UserScript==
// @name         ShanghaiTech Mail TOTP
// @namespace    https://github.com/ShanghaitechGeekPie/ShanghaiTech-Mail-TOTP
// @version      0.1
// @description  Use 3rd TOTP apps instead of Coremail to login ShanghaiTech Mail. 
// @author       ShanghaitechGeekPie
// @match        https://mail.shanghaitech.edu.cn/coremail/XT/index.jsp*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shanghaitech.edu.cn
// @grant        none
// @require      https://unpkg.com/jsqr@latest/dist/jsQR.js
// @require      https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js
// ==/UserScript==

(function () {
  'use strict';

  function waitForSettingPanel() {
    const panel = document.querySelector('.m-setting-panel');
    if (panel) {
      console.debug('Arrived .m-setting-panel');
      observeDialog(panel);
    } else {
      // delay and retry
      requestAnimationFrame(waitForSettingPanel);
    }
  }

  function observeDialog(panel) {
    const observer = new MutationObserver(muts => {
      for (const mut of muts) {
        for (const node of mut.addedNodes) {
          if (node.nodeType === 1 && node.matches('.u-dialog.u-dialog-2fa')) {
            console.debug('Opened 2FA dialog', node);
            processDialog(node);
          }
        }
      }
    });

    observer.observe(panel, {
      childList: true,
      subtree: true,
    });
  }

  let lastQRCodeData = {
    "user": "",
    "secret": "",
    "authkey": "",
    "origin": "https://mail.shanghaitech.edu.cn"
  }

  function processDialog(dialog) {
    const img = dialog.querySelector('img[alt="Scan me!"]');
    if (!img) {
      return;
    }

    if (img.src && img.src.startsWith('data:image')) {
      decodeQRFromDataURL(img.src);
      img.style.display = 'none';
    }

    const imgObserver = new MutationObserver(muts => {
      for (const mut of muts) {
        if (mut.type === 'attributes' && mut.attributeName === 'src') {
          const newSrc = img.getAttribute('src');
          if (newSrc && newSrc.startsWith('data:image')) {
            console.debug('QRCode src updated');
            decodeQRFromDataURL(newSrc);
          }
        }
      }
    });

    imgObserver.observe(img, { attributes: true, attributeFilter: ['src'] });

    addDebugControls(dialog);
  }

  function addDebugControls(dialog) {
    const contentDiv = dialog.querySelector('.u-dialog-content');
    if (!contentDiv) return;

    // 更改 .auth-desc inner HTML
    const authDesc = dialog.querySelector('.auth-desc');
    if (authDesc) {
      authDesc.innerHTML = '请使用支持 TOTP 的第三方应用（如 <a href="https://getaegis.app/">Aegis</a>、<a href="https://tofuauth.com/">TofuAuth</a> 等）扫描下方二维码进行绑定，然后输入生成的动态密码完成绑定。';
    }

    // 更改 .auth-desc-sub HTML
    const authDescSub = dialog.querySelector('.auth-desc-sub');
    if (authDescSub) {
      authDescSub.innerHTML = `
      Made by <a href="https://geekpie.club">GeekPie_</a> with ❤️ for ShanghaiTech Mail users.
      <br/>
      <br/>
      GitHub: <a href="https://github.com/ShanghaitechGeekPie/ShanghaiTech-Mail-TOTP">ShanghaitechGeekPie/ShanghaiTech-Mail-TOTP</a>
      <br/>
      under MIT License
      <br/>
      您可以在浏览器控制台查看二维码数据以备不时之需。
      `;
    }

    // Replace QRCode wrapper
    const originalWrapper = dialog.querySelector('.auth-qrcode-wrapper');
    if (originalWrapper) {
      originalWrapper.style.display = 'none';
    }

    const newWrapper = document.createElement('div');
    newWrapper.className = 'otp-qrcode-wrapper';
    newWrapper.title = '';
    newWrapper.style.cssText = 'text-align: center;';

    const newImg = document.createElement('img');
    newImg.alt = 'Scan TOTP!';
    newImg.style.cssText = 'display: block; margin: 0 auto;';

    newWrapper.appendChild(newImg);

    if (originalWrapper) {
      originalWrapper.parentNode.insertBefore(newWrapper, originalWrapper);
    }

    // Control panel
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = 'margin-top: 15px; padding: 10px; border-top: 1px solid #ddd;';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入 6 位动态密码...';
    input.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;';

    const button = document.createElement('button');
    button.textContent = '完成绑定';
    button.style.cssText = 'width: 100%; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';

    button.addEventListener('click', () => {
      const inputValue = input.value;
      fetch('https://mail.shanghaitech.edu.cn/coremail/s/json?func=user:updateSecondAuth',
        {
          "credentials": "include",
          "headers": {
            "Content-Type": "text/x-json;tz=UTC;useTypeCastExtension=true;charset=UTF-8",
          },
          "body": `{"issuer":"Coremail","bindIssuer":"Lunkr","tempSid":"","bindUid":"${lastQRCodeData.user}","secret":"${lastQRCodeData.secret}","uid":"${lastQRCodeData.user}","verifyCode":"${inputValue}","deviceInfo":{"version":35,"model":"ShanghaitechGeekPie/ShanghaiTech-Mail-TOTP","platform":"Android","apptype":"Coremail论客","uuid":"19260817-join-gkpy-club-shanghaitech","authkey":"${lastQRCodeData.authkey}","friendlyName":"GEEKPIE-DUMMY"}}`,
          "method": "POST",
          "mode": "cors"
        }
      ).then(res => res.json()).then(data => {
        console.debug('Resp:', data);
        if (data.code === "S_OK") {
          // auto quit
        } else if (data.code === "FA_INVALID_DYNAMIC_PWD") {
          alert(`动态密码不正确或过期 (FA_INVALID_DYNAMIC_PWD)`);
        } else {
          alert(`错误：${data.code}`)
        }
      }).catch(err => {
        console.error('Fetch:', err);
        alert(`请求失败:\n\n${err}`);
      });
    });

    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#0056b3';
    });
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#007bff';
    });

    controlPanel.appendChild(input);
    controlPanel.appendChild(button);
    contentDiv.appendChild(controlPanel);
  }

  function decodeQRFromDataURL(dataURL) {
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        const parsed = parseCoremailOtpUrl(code.data);
        if (parsed) {
          lastQRCodeData = parsed;
          const newImg = document.querySelector('.otp-qrcode-wrapper img');

          if (!newImg) return;

          const TOTPCode = `otpauth://totp/ShanghaiTech%20Mail%3A${lastQRCodeData.user.replace("@", "%40")}?period=30&digits=6&algorithm=SHA1&secret=${lastQRCodeData.secret}&issuer=ShanghaiTechMail`
          console.log('TOTP URL:', TOTPCode);

          QRCode.toDataURL(TOTPCode).then(url => {
            newImg.src = url;
          });
        }
      } else {
        console.warn('No QR code recognized');
      }
    };
  }

  function parseCoremailOtpUrl(url) {
    try {
      if (!url.startsWith('cm-otpauth://')) return null;

      const [, rest] = url.split('cm-otpauth://');
      const [userPart, queryPart] = rest.split('?');
      const user = decodeURIComponent(userPart);

      const params = new URLSearchParams(queryPart);
      const secret = params.get('secret');
      const authkey = params.get('authkey');
      const origin = decodeURIComponent(params.get('origin') || '');

      return { user, secret, authkey, origin };
    } catch (e) {
      console.warn('QRCode decode failed:', e);
      return null;
    }
  }

  waitForSettingPanel();
})();
