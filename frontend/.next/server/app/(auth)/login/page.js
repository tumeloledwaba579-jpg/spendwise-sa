(()=>{var e={};e.id=665,e.ids=[665],e.modules={7849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},1877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},5319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},6:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>p,pages:()=>d,routeModule:()=>m,tree:()=>c});var s=r(482),o=r(9108),i=r(2563),n=r.n(i),a=r(8300),l={};for(let e in a)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>a[e]);r.d(t,l);let c=["",{children:["(auth)",{children:["login",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,2169)),"C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\(auth)\\login\\page.tsx"]}]},{}]},{"not-found":[()=>Promise.resolve().then(r.t.bind(r,9361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,6313)),"C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9361,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\(auth)\\login\\page.tsx"],p="/(auth)/login/page",x={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/(auth)/login/page",pathname:"/login",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},5121:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,2583,23)),Promise.resolve().then(r.t.bind(r,6840,23)),Promise.resolve().then(r.t.bind(r,8771,23)),Promise.resolve().then(r.t.bind(r,3225,23)),Promise.resolve().then(r.t.bind(r,9295,23)),Promise.resolve().then(r.t.bind(r,3982,23))},3746:(e,t,r)=>{Promise.resolve().then(r.bind(r,3473))},2882:(e,t,r)=>{Promise.resolve().then(r.bind(r,5814))},3473:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>i});var s=r(2295),o=r(3729);let i=()=>{let[e,t]=(0,o.useState)({email:"",password:"",rememberMe:!1}),[r,i]=(0,o.useState)({}),[n,a]=(0,o.useState)(!1),[l,c]=(0,o.useState)(!1),d=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),p=()=>{let t={};return e.email.trim()?d(e.email)||(t.email="Please enter a valid email address"):t.email="Email is required",e.password?e.password.length<6&&(t.password="Password must be at least 6 characters"):t.password="Password is required",i(t),0===Object.keys(t).length},x=async t=>{if(t.preventDefault(),p()){a(!0),i({});try{let t=await fetch("/api/v1/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e.email,password:e.password})}),r=await t.json();t.ok?(e.rememberMe?localStorage.setItem("auth_token",r.access_token):sessionStorage.setItem("auth_token",r.access_token),window.location.href="/dashboard"):i({general:r.message||"Invalid email or password"})}catch(e){i({general:"Network error. Please try again."})}finally{a(!1)}}},m=(e,s)=>{t(t=>({...t,[e]:s})),r[e]&&i(t=>({...t,[e]:void 0}))};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)("div",{className:"login-page",children:[s.jsx("div",{className:"login-left",children:(0,s.jsxs)("div",{className:"login-left-content",children:[s.jsx("a",{href:"/",className:"logo",children:"SpendWise SA"}),(0,s.jsxs)("div",{className:"marketing-content",children:[(0,s.jsxs)("h1",{className:"marketing-title",children:["Welcome back to your",s.jsx("span",{className:"marketing-title-gradient",children:" financial control center"})]}),s.jsx("p",{className:"marketing-description",children:"Continue your journey to financial freedom. Track your progress, manage debt, and achieve your goals."}),(0,s.jsxs)("div",{className:"trust-badges",children:[(0,s.jsxs)("div",{className:"trust-badge",children:[s.jsx("svg",{className:"trust-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:s.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})}),s.jsx("span",{children:"Bank-Level Security"})]}),(0,s.jsxs)("div",{className:"trust-badge",children:[(0,s.jsxs)("svg",{className:"trust-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),s.jsx("polyline",{points:"22 4 12 14.01 9 11.01"})]}),s.jsx("span",{children:"50,000+ Users"})]})]}),(0,s.jsxs)("div",{className:"stats-preview",children:[(0,s.jsxs)("div",{className:"stat-item",children:[s.jsx("div",{className:"stat-label",children:"Average Debt Reduction"}),s.jsx("div",{className:"stat-value",children:"32%"})]}),(0,s.jsxs)("div",{className:"stat-item",children:[s.jsx("div",{className:"stat-label",children:"Avg. Net Worth Growth"}),s.jsx("div",{className:"stat-value",children:"+R 45K"})]})]})]})]})}),s.jsx("div",{className:"login-right",children:(0,s.jsxs)("div",{className:"login-form-container",children:[(0,s.jsxs)("div",{className:"form-header",children:[s.jsx("h2",{className:"form-title",children:"Sign In"}),s.jsx("p",{className:"form-subtitle",children:"Enter your credentials to access your account"})]}),(0,s.jsxs)("div",{className:"demo-banner",children:[(0,s.jsxs)("svg",{className:"demo-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("path",{d:"M12 16v-4"}),s.jsx("path",{d:"M12 8h.01"})]}),s.jsx("span",{children:"Want to try it out?"}),s.jsx("button",{type:"button",onClick:()=>{t({email:"demo@spendwise.co.za",password:"demo123",rememberMe:!1})},className:"demo-link",children:"Use Demo Account"})]}),r.general&&(0,s.jsxs)("div",{className:"alert alert-error",children:[(0,s.jsxs)("svg",{className:"alert-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("circle",{cx:"12",cy:"12",r:"10"}),s.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),s.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),s.jsx("span",{children:r.general})]}),(0,s.jsxs)("form",{onSubmit:x,className:"login-form",noValidate:!0,children:[(0,s.jsxs)("div",{className:"form-group",children:[s.jsx("label",{htmlFor:"email",className:"form-label",children:"Email Address"}),(0,s.jsxs)("div",{className:"input-wrapper",children:[(0,s.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("path",{d:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}),s.jsx("polyline",{points:"22,6 12,13 2,6"})]}),s.jsx("input",{id:"email",type:"email",className:`form-input ${r.email?"error":""}`,placeholder:"you@example.com",value:e.email,onChange:e=>m("email",e.target.value),autoComplete:"email",disabled:n})]}),r.email&&s.jsx("p",{className:"error-message",children:r.email})]}),(0,s.jsxs)("div",{className:"form-group",children:[(0,s.jsxs)("div",{className:"form-label-row",children:[s.jsx("label",{htmlFor:"password",className:"form-label",children:"Password"}),s.jsx("a",{href:"/forgot-password",className:"forgot-link",children:"Forgot password?"})]}),(0,s.jsxs)("div",{className:"input-wrapper",children:[(0,s.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),s.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),s.jsx("input",{id:"password",type:l?"text":"password",className:`form-input ${r.password?"error":""}`,placeholder:"Enter your password",value:e.password,onChange:e=>m("password",e.target.value),autoComplete:"current-password",disabled:n}),s.jsx("button",{type:"button",className:"password-toggle",onClick:()=>c(!l),"aria-label":l?"Hide password":"Show password",children:l?(0,s.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),s.jsx("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}):(0,s.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),s.jsx("circle",{cx:"12",cy:"12",r:"3"})]})})]}),r.password&&s.jsx("p",{className:"error-message",children:r.password})]}),s.jsx("div",{className:"form-options",children:(0,s.jsxs)("label",{className:"checkbox-label",children:[s.jsx("input",{type:"checkbox",checked:e.rememberMe,onChange:e=>m("rememberMe",e.target.checked),disabled:n}),s.jsx("span",{className:"checkbox-custom"}),s.jsx("span",{className:"checkbox-text",children:"Remember me for 30 days"})]})}),s.jsx("button",{type:"submit",className:"btn-submit",disabled:n,children:n?(0,s.jsxs)(s.Fragment,{children:[s.jsx("svg",{className:"spinner",viewBox:"0 0 24 24",children:s.jsx("circle",{className:"spinner-circle",cx:"12",cy:"12",r:"10",fill:"none",strokeWidth:"3"})}),"Signing in..."]}):(0,s.jsxs)(s.Fragment,{children:["Sign In",(0,s.jsxs)("svg",{className:"btn-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[s.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),s.jsx("polyline",{points:"12 5 19 12 12 19"})]})]})})]}),s.jsx("div",{className:"divider",children:s.jsx("span",{className:"divider-text",children:"or continue with"})}),(0,s.jsxs)("div",{className:"social-login",children:[(0,s.jsxs)("button",{type:"button",className:"social-btn",children:[(0,s.jsxs)("svg",{className:"social-icon",viewBox:"0 0 24 24",children:[s.jsx("path",{fill:"currentColor",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),s.jsx("path",{fill:"currentColor",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),s.jsx("path",{fill:"currentColor",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),s.jsx("path",{fill:"currentColor",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),"Google"]}),(0,s.jsxs)("button",{type:"button",className:"social-btn",children:[s.jsx("svg",{className:"social-icon",viewBox:"0 0 24 24",fill:"currentColor",children:s.jsx("path",{d:"M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"})}),"GitHub"]})]}),(0,s.jsxs)("div",{className:"footer-link",children:["Don't have an account?"," ",s.jsx("a",{href:"/register",className:"link",children:"Sign up for free"})]})]})})]}),s.jsx("style",{children:`
        /* All the CSS from the previous version stays exactly the same */
        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-left {
          background: linear-gradient(135deg, #002855 0%, #0052CC 50%, #00875A 100%);
          position: relative;
          overflow: hidden;
          padding: 48px;
          display: flex;
          align-items: center;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -25%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 200, 83, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 20s ease-in-out infinite;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 102, 204, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 25s ease-in-out infinite reverse;
        }

        .login-left-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .logo {
          display: inline-block;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #00E676 0%, #FFFFFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 48px;
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .marketing-content {
          color: white;
        }

        .marketing-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }

        .marketing-title-gradient {
          background: linear-gradient(135deg, #00E676 0%, #00C853 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .marketing-description {
          font-size: 18px;
          line-height: 1.7;
          opacity: 0.9;
          margin-bottom: 40px;
        }

        .trust-badges {
          display: flex;
          gap: 24px;
          margin-bottom: 48px;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .trust-icon {
          width: 20px;
          height: 20px;
          color: #00E676;
        }

        .stats-preview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .stat-item {
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        .login-right {
          background: #FAFBFC;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
        }

        .login-form-container {
          width: 100%;
          max-width: 460px;
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-header {
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 36px;
          font-weight: 800;
          color: #091E42;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6B778C;
        }

        .demo-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #DEEBFF, #C8DDFF);
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #0052CC;
          font-weight: 500;
        }

        .demo-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .demo-link {
          margin-left: auto;
          padding: 6px 16px;
          background: #0052CC;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-link:hover {
          background: #0066CC;
          transform: translateY(-1px);
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: #FFEBE6;
          color: #DE350B;
          border: 1px solid #FFBDAD;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .login-form {
          margin-bottom: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 8px;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .forgot-link {
          font-size: 14px;
          color: #0052CC;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #0066CC;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #6B778C;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: inherit;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          background: white;
          color: #091E42;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input::placeholder {
          color: #97A0AF;
        }

        .form-input:focus {
          outline: none;
          border-color: #0052CC;
          box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.1);
        }

        .form-input.error {
          border-color: #DE350B;
          background: #FFF4F3;
        }

        .form-input.error:focus {
          border-color: #DE350B;
          box-shadow: 0 0 0 4px rgba(222, 53, 11, 0.1);
        }

        .form-input:disabled {
          background: #F4F5F7;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6B778C;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #091E42;
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
          display: block;
        }

        .error-message {
          margin-top: 8px;
          font-size: 13px;
          color: #DE350B;
          font-weight: 500;
        }

        .form-options {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #DFE1E6;
          border-radius: 4px;
          margin-right: 12px;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
          background: #0052CC;
          border-color: #0052CC;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 5px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-text {
          font-size: 14px;
          color: #505F79;
        }

        .btn-submit {
          width: 100%;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          color: white;
          background: linear-gradient(135deg, #0066CC 0%, #00C853 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        .spinner-circle {
          stroke: currentColor;
          stroke-dasharray: 50;
          stroke-dashoffset: 0;
          animation: spinnerDash 1.5s ease-in-out infinite;
        }

        .divider {
          position: relative;
          text-align: center;
          margin: 32px 0;
        }

        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #DFE1E6;
        }

        .divider-text {
          position: relative;
          display: inline-block;
          padding: 0 16px;
          background: #FAFBFC;
          font-size: 14px;
          color: #6B778C;
          font-weight: 500;
        }

        .social-login {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          color: #091E42;
          background: white;
          border: 2px solid #DFE1E6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .social-btn:hover {
          border-color: #0052CC;
          background: #FAFBFC;
        }

        .social-icon {
          width: 20px;
          height: 20px;
        }

        .footer-link {
          text-align: center;
          font-size: 15px;
          color: #6B778C;
        }

        .link {
          color: #0052CC;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .link:hover {
          color: #0066CC;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spinnerDash {
          0% {
            stroke-dashoffset: 50;
          }
          50% {
            stroke-dashoffset: 12.5;
            transform: rotate(135deg);
          }
          100% {
            stroke-dashoffset: 50;
            transform: rotate(450deg);
          }
        }

        @media (max-width: 1024px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .login-left {
            display: none;
          }

          .login-right {
            padding: 32px 24px;
          }
        }

        @media (max-width: 480px) {
          .login-right {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 28px;
          }

          .social-login {
            grid-template-columns: 1fr;
          }
        }
      `})]})}},5814:(e,t,r)=>{"use strict";r.r(t),r.d(t,{AuthProvider:()=>n,useAuth:()=>a});var s=r(2295),o=r(3729);let i=(0,o.createContext)(void 0);function n({children:e}){let[t,r]=(0,o.useState)(null),[n,a]=(0,o.useState)(null),[l,c]=(0,o.useState)(!0);(0,o.useEffect)(()=>{c(!1)},[!1]);let d=async(e,t)=>{let s={id:"1",email:e,full_name:"John Doe"},o="mock-jwt-token";return a(o),r(s),{success:!0,data:{access_token:o,user:s}}},p=async e=>{let t={id:"1",email:e.email,full_name:e.full_name||"New User"},s="mock-jwt-token";return a(s),r(t),{success:!0,data:{access_token:s,user:t}}};return s.jsx(i.Provider,{value:{user:t,token:n,isLoading:l,isAuthenticated:!!n&&!!t,login:d,register:p,logout:()=>{a(null),r(null)}},children:e})}let a=()=>{let e=(0,o.useContext)(i);if(!e)throw Error("useAuth must be used within an AuthProvider");return e}},2169:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>o,default:()=>n});let s=(0,r(6843).createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\app\(auth)\login\page.tsx`),{__esModule:o,$$typeof:i}=s,n=s.default},6313:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>d,metadata:()=>c});var s=r(5036);r(5023);var o=r(6843);let i=(0,o.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx`),{__esModule:n,$$typeof:a}=i;i.default;let l=(0,o.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx#AuthProvider`);(0,o.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx#useAuth`);let c={title:"SpendWise SA",description:"Personal Finance Management"};function d({children:e}){return s.jsx("html",{lang:"en",children:s.jsx("body",{children:s.jsx(l,{children:e})})})}},5023:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[454],()=>r(6));module.exports=s})();