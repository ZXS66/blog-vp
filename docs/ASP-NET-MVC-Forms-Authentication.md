---
title: ASP.NET MVC 表单认证
tags:
  - asp.net
  - mvc
  - forms authentication
  - windows authentication
date: 2021-03-14 10:24:00
---

开始之前，先发一句牢骚，平时我们用微软技术栈（`ASP.NET`、`C#`、`.NET Core`），就是因为看中了绝大多数公司办公环境是 `Windows` 桌面系统，使用微软技术栈能够更好的与 `OA`、`SMTP` 邮箱、`ERP` 等企业内部系统深度集成。省去了用户权限设计不说（和其他系统共用一个 AD 域账户），还能方便开发者快速搭建原型。所以，我之前编写的 `ASP.NET` 网站基本上都是使用的 `Windows` 认证。然而，前几天某客户 IT 的标准要求，不能使用 `Windows` 认证。具体来说，不是不能使用 `Windows` 认证，是不能使用各浏览器自带的用户权限输入框来填写用户名密码。我们写的 APP 必须有自己的登陆/登出页面，同时为了使用 AD 域账户，我们的 APP 拿到用户名和**密码**后去 AD 里验证合法性。当时听到这个整个，心中一百个 CNM 在奔腾。你们真的确定吗？？？

先不说这个标准是谁定的，脑子瓦塌了？你真的放心让我来接触域账户密码(明文)？！我自己都害怕。。。不担心我私自存储用户密码？不担心用户填写信息时候被窃听？至少你使用 `SSO` （Single-Sign On，单点登录）都比这个强啊！

## 更改 web.config

打开目标站点的 `web.config` 文件，更新 `authentication` 和 `authorization` 节点配置如下：

``` xml
<system.web>
  <httpCookies requireSSL="true" httpOnlyCookies="true" />
  <authentication mode="Forms">
    <forms name="at" requireSSL="true" loginUrl="~/v3/Home/Login" slidingExpiration="true" timeout="32" defaultUrl="/v3/app/en/index.html" path="/v3">
    </forms>
  </authentication>
  <authorization>
    <deny users="?"/>
  </authorization>
</system.web>
```

## 更改 IIS 配置

运行 `inetmgr` 命令，进入 IIS，选中需要更改的目标站点，点击认证（Authentication），启用匿名认证（Anonymous Authentication）和表单认证（Forms Authentication）,禁用其他认证方式（如 Windows 认证、Basic 认证等等）。

## 更新相关代码

新建/打开 `Views/Home/Login.cshtml` 文件，更新代码如下：

``` html
@{
    Layout = null;
}
<!DOCTYPE html>

<html>
<head>
    <meta name="viewport" content="width=device-width" />
    <title>Please login</title>
    <style>
        #login-form {
            width: 16em;
            margin: 0 auto;
            padding: 1em;
            box-shadow: 0 0 0.5em 0.125em gray;
        }

            #login-form img {
                width: 4em;
            }

            #login-form h2 {
                text-align: center;
            }

            #login-form fieldset {
                border: none;
            }

            #login-form input {
                width: 100%;
                box-sizing: border-box;
                border: none;
                border-bottom: 1px solid gray;
                outline: none;
                font-size: 1.125em;
            }

                #login-form input[type=submit] {
                    border: none;
                    background-color: skyblue;
                    color: white;
                    cursor: pointer;
                    padding: 0.5em;
                    font-size: 1em;
                }

            #login-form footer {
                text-align: center;
            }
    </style>
</head>
<body>
    <div id="login-form">
        <h2>XXXX Platform</h2>
        @using (Html.BeginForm("Login", "Home", FormMethod.Post))
        {
            @Html.AntiForgeryToken()
            <fieldset> Login </fieldset>
            <p>
                <input type="text" name="username" placeholder="user name" required maxlength="16" minlength="4" />
            </p>
            <p>
                <input type="password" name="password" placeholder="password" required maxlength="32" minlength="10" />
            </p>
            <input type="hidden" name="ts" />
            <input type="submit" value="→ LOGIN" />
        }
        <footer>
            <p>Copyright &copy; XXXX @(DateTime.Now.Year)</p>
        </footer>
    </div>
    <script>
        document.forms[0].addEventListener('submit', function () {
            document.forms[0].ts.value = Date.now();
        });
    </script>
</body>
</html>
```

新建/打开 `Controllers/HomeController.cs`，更新代码如下：

``` cs
    /// <summary>
    /// default controller
    /// </summary>
    public class HomeController : Controller
    {
        /// <summary>
        /// default action for HomeController
        /// </summary>
        /// <returns></returns>
        public ActionResult Index()
        {
            ViewBag.Title = "Home Page";
            return View();
        }
        /// <summary>
        /// browse login page
        /// </summary>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult Login()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                // user already logged in
                this.clearUserState();
                // return Redirect(FormsAuthentication.DefaultUrl);
            }
            return View();
        }
        /// <summary>
        /// authenticate user with Authorization header
        /// </summary>
        /// <returns></returns>
        [HttpPost,ValidateAntiForgeryToken]
        public ActionResult Login(LoginFormData form)
        {
            // login form validation
            if (form == null)
                throw new AuthenticationException("empty login form");
            if (string.IsNullOrWhiteSpace(form.username))
                throw new AuthenticationException($"empty {nameof(form.username)}");
            if (string.IsNullOrWhiteSpace(form.password))
                throw new AuthenticationException($"empty {nameof(form.password)}");
            if (form.ts == 0)
                throw new AuthenticationException($"empty {nameof(form.ts)}(timestamp)");
            // permit only the characters required and field length necessary 
            if (!System.Text.RegularExpressions.Regex.Match(form.username, @"^[a-zA-Z0-9\-\.]{4,16}$").Success)
                throw new AuthenticationException($"invalid {nameof(form.username)}");
            if (!(
                /* a mimumum of 10 and maximum of 32 characters */
                /* printable characters, including space */
                System.Text.RegularExpressions.Regex.Match(form.password, @"^[\s!-~]{10,32}$").Success
                  /* at least 1 lower case alpha character (A-Z) */
                  /* at least 1 upper case alpha character (A-Z) */
                  /* at least 1 numberic character(0-9) */
                  && System.Text.RegularExpressions.Regex.Match(form.password, @"^(?=.*[a-z]+)(?=.*[A-Z]+)(?=.*[0-9]+)").Success
                ))
                throw new AuthenticationException($"invalid {nameof(form.password)}");
            // prevent form replay attach
            long unixTime = ((DateTimeOffset)DateTime.UtcNow).ToUnixTimeSeconds();
            if (Math.Abs(unixTime - (form.ts) / 1000) > 10)
                // the timestamp gap between client and server is greater than 10 seconds
                throw new AuthenticationException("NO Form Replay Attach!!!");

            using (var pCtx = new PrincipalContext(ContextType.Domain, Constants.ADDomain))
            {
                // validate credential against AD server
                bool flag = pCtx.ValidateCredentials(form.username, form.password);
                if (flag)
                {
                    // validate successfully
                    var ticket = new FormsAuthenticationTicket
                    (
                        1,
                        form.username,
                        DateTime.Now,
                        DateTime.Now.AddMinutes(Constants.SessionDurationInMinutes),
                        Constants.CreatePersistentCookie,
                        "salt",  // user specified data
                        FormsAuthentication.FormsCookiePath
                    );
                    var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, FormsAuthentication.Encrypt(ticket))
                    {
                        Secure = true,
                        HttpOnly = true,
                        Path = ticket.CookiePath
                    };
                    Response.Cookies.Add(cookie);
                    // save login ticket
                    // to prevent concurrent logins from same user
                    Biz.Helper.UACHelper.UserLogin(cookie.Value);
                    Logger.Info("Audit Success", form.username, this.Request?.UserHostAddress);   // success login audit
                    return Redirect(FormsAuthentication.DefaultUrl);
                }
                else
                {
                    // validate failed
                    Logger.Info("Audit Failure", form.username, this.Request?.UserHostAddress);   // failed login audit
                    return RedirectToAction("Login");
                }
            }
        }
        /// <summary>
        /// logout page
        /// </summary>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult Logout()
        {
            this.clearUserState();
            Logger.Info("logout audit", this.User?.Identity?.Name, this.Request?.UserHostAddress);   // logout audit
            return View();
        }
        private void clearUserState()
        {
            FormsAuthentication.SignOut();
            // clear authentication cookie
            HttpCookie authTokenCookie = new HttpCookie(FormsAuthentication.FormsCookieName, string.Empty) { Secure = true, HttpOnly = true };
            authTokenCookie.Expires = DateTime.Now.AddYears(-1);
            Response.Cookies.Add(authTokenCookie);
            // clear session
            Session.Clear();
            Session.Abandon();
            //Session.RemoveAll();
            //HttpContext.User = new System.Security.Principal.GenericPrincipal(new System.Security.Principal.GenericIdentity(string.Empty), null);
        }
    }
```

## 备注

1. 应整改要求，Cookie Path 没有特殊批复，不得设置为根路径(`/`)，故此处的 Cookie Path 设置为 `/v3` (所有页面放置于 `/v3/app` 目录下，API 在 `/v3/api` 路径下)；
2. 默认开启 Secure 和 HttpOnly 属性，防止 CSRF；
3. 此处示例代码，表面上启用表单验证，其实后台服务器将用户填写的表单发送至服务器的域服务器（AD Server）验证。各位看官可以根据自身实际情况调整；
4. 待调整事项：此处 `Login.cshtml` 使用了内联脚本。但如果公司启用了严格 CSP，该内联脚本将会被禁用，可考虑移至外部脚本中。

## 参考链接

- [Implement forms-based authentication in an ASP.NET application by using C#.NET](https://docs.microsoft.com/en-us/troubleshoot/aspnet/forms-based-authentication)
- [Forms Authentication In ASP.NET](https://www.c-sharpcorner.com/UploadFile/fa9d0d/forms-authentication-in-Asp-Net/)
