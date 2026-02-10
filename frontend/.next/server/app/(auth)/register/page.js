(()=>{var e={};e.id=566,e.ids=[566],e.modules={7849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},1877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},5319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},7827:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>a.a,__next_app__:()=>m,originalPathname:()=>p,pages:()=>d,routeModule:()=>x,tree:()=>c});var r=s(482),i=s(9108),o=s(2563),a=s.n(o),n=s(8300),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);s.d(t,l);let c=["",{children:["(auth)",{children:["register",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,8427)),"C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\(auth)\\register\\page.tsx"]}]},{}]},{"not-found":[()=>Promise.resolve().then(s.t.bind(s,9361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,6313)),"C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9361,23)),"next/dist/client/components/not-found-error"]}],d=["C:\\Users\\tumel\\spendwise-sa\\frontend\\src\\app\\(auth)\\register\\page.tsx"],p="/(auth)/register/page",m={require:s,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/(auth)/register/page",pathname:"/register",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},5121:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,2583,23)),Promise.resolve().then(s.t.bind(s,6840,23)),Promise.resolve().then(s.t.bind(s,8771,23)),Promise.resolve().then(s.t.bind(s,3225,23)),Promise.resolve().then(s.t.bind(s,9295,23)),Promise.resolve().then(s.t.bind(s,3982,23))},340:(e,t,s)=>{Promise.resolve().then(s.bind(s,4377))},2882:(e,t,s)=>{Promise.resolve().then(s.bind(s,5814))},4377:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>o});var r=s(2295),i=s(3729);let o=()=>{let[e,t]=(0,i.useState)(1),[s,o]=(0,i.useState)({firstName:"",lastName:"",email:"",password:"",confirmPassword:"",phone:"",acceptTerms:!1,receiveUpdates:!0}),[a,n]=(0,i.useState)({}),[l,c]=(0,i.useState)(!1),[d,p]=(0,i.useState)(!1),[m,x]=(0,i.useState)(!1),h=(e=>{let t=0;return e?(e.length>=8&&(t+=1),e.length>=12&&(t+=1),/[a-z]/.test(e)&&(t+=1),/[A-Z]/.test(e)&&(t+=1),/[0-9]/.test(e)&&(t+=1),/[^A-Za-z0-9]/.test(e)&&(t+=1),t<=2)?{score:1,label:"Weak",color:"#DE350B"}:t<=4?{score:2,label:"Fair",color:"#FF991F"}:t<=5?{score:3,label:"Good",color:"#00875A"}:{score:4,label:"Strong",color:"#00C853"}:{score:0,label:"",color:""}})(s.password),u=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),g=e=>/^(\+27|0)[6-8][0-9]{8}$/.test(e.replace(/\s/g,"")),f=()=>{let e={};return s.firstName.trim()?s.firstName.length<2&&(e.firstName="First name must be at least 2 characters"):e.firstName="First name is required",s.lastName.trim()?s.lastName.length<2&&(e.lastName="Last name must be at least 2 characters"):e.lastName="Last name is required",s.email.trim()?u(s.email)||(e.email="Please enter a valid email address"):e.email="Email is required",s.phone.trim()?g(s.phone)||(e.phone="Please enter a valid South African phone number"):e.phone="Phone number is required",n(e),0===Object.keys(e).length},b=()=>{let e={};return s.password?s.password.length<8?e.password="Password must be at least 8 characters":/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(s.password)||(e.password="Password must contain uppercase, lowercase, and numbers"):e.password="Password is required",s.confirmPassword?s.password!==s.confirmPassword&&(e.confirmPassword="Passwords do not match"):e.confirmPassword="Please confirm your password",s.acceptTerms||(e.acceptTerms="You must accept the terms and conditions"),n(e),0===Object.keys(e).length},v=async e=>{if(e.preventDefault(),b()){c(!0),n({});try{let e=await fetch("/api/v1/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({first_name:s.firstName,last_name:s.lastName,email:s.email,password:s.password,phone:s.phone,marketing_consent:s.receiveUpdates})}),t=await e.json();e.ok?(localStorage.setItem("auth_token",t.access_token),window.location.href="/onboarding"):n({general:t.message||"Registration failed. Please try again."})}catch(e){n({general:"Network error. Please check your connection and try again."})}finally{c(!1)}}},j=(e,t)=>{o(s=>({...s,[e]:t})),a[e]&&n(t=>({...t,[e]:void 0}))},w=e=>{window.location.href=`/api/v1/auth/oauth/${e}`};return r.jsx(r.Fragment,{children:(0,r.jsxs)("div",{className:"register-page",children:[r.jsx("div",{className:"register-left",children:(0,r.jsxs)("div",{className:"register-left-content",children:[r.jsx("a",{href:"/",className:"logo",children:"SpendWise SA"}),(0,r.jsxs)("div",{className:"marketing-content",children:[(0,r.jsxs)("h1",{className:"marketing-title",children:["Start your journey to",r.jsx("span",{className:"marketing-title-gradient",children:" financial freedom"})]}),r.jsx("p",{className:"marketing-description",children:"Join 50,000+ South Africans who have taken control of their money with our intelligent financial management platform."}),(0,r.jsxs)("div",{className:"benefits-list",children:[(0,r.jsxs)("div",{className:"benefit-item",children:[r.jsx("div",{className:"benefit-icon",children:(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14"}),r.jsx("polyline",{points:"22 4 12 14.01 9 11.01"})]})}),(0,r.jsxs)("div",{className:"benefit-content",children:[r.jsx("div",{className:"benefit-title",children:"Free Forever"}),r.jsx("div",{className:"benefit-description",children:"All features included, no hidden fees"})]})]}),(0,r.jsxs)("div",{className:"benefit-item",children:[r.jsx("div",{className:"benefit-icon",children:r.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})})}),(0,r.jsxs)("div",{className:"benefit-content",children:[r.jsx("div",{className:"benefit-title",children:"Bank-Level Security"}),r.jsx("div",{className:"benefit-description",children:"256-bit encryption protects your data"})]})]}),(0,r.jsxs)("div",{className:"benefit-item",children:[r.jsx("div",{className:"benefit-icon",children:r.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"22 12 18 12 15 21 9 3 6 12 2 12"})})}),(0,r.jsxs)("div",{className:"benefit-content",children:[r.jsx("div",{className:"benefit-title",children:"Smart Insights"}),r.jsx("div",{className:"benefit-description",children:"AI-powered recommendations for your goals"})]})]}),(0,r.jsxs)("div",{className:"benefit-item",children:[r.jsx("div",{className:"benefit-icon",children:(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("polyline",{points:"12 6 12 12 16 14"})]})}),(0,r.jsxs)("div",{className:"benefit-content",children:[r.jsx("div",{className:"benefit-title",children:"Setup in 2 Minutes"}),r.jsx("div",{className:"benefit-description",children:"Quick registration, instant access"})]})]})]}),(0,r.jsxs)("div",{className:"testimonial",children:[r.jsx("div",{className:"testimonial-quote",children:'"SpendWise helped me pay off R45,000 in debt in just 18 months. The debt payoff calculator was a game-changer!"'}),(0,r.jsxs)("div",{className:"testimonial-author",children:[r.jsx("div",{className:"author-avatar",children:"TM"}),(0,r.jsxs)("div",{children:[r.jsx("div",{className:"author-name",children:"Thabo Mokoena"}),r.jsx("div",{className:"author-title",children:"Johannesburg"})]})]})]})]})]})}),r.jsx("div",{className:"register-right",children:(0,r.jsxs)("div",{className:"register-form-container",children:[(0,r.jsxs)("div",{className:"progress-indicator",children:[(0,r.jsxs)("div",{className:`progress-step ${e>=1?"active":""} ${e>1?"completed":""}`,children:[r.jsx("div",{className:"step-number",children:e>1?r.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})}):"1"}),r.jsx("div",{className:"step-label",children:"Personal Info"})]}),r.jsx("div",{className:"progress-line"}),(0,r.jsxs)("div",{className:`progress-step ${e>=2?"active":""}`,children:[r.jsx("div",{className:"step-number",children:"2"}),r.jsx("div",{className:"step-label",children:"Security"})]})]}),(0,r.jsxs)("div",{className:"form-header",children:[r.jsx("h2",{className:"form-title",children:1===e?"Create Your Account":"Secure Your Account"}),r.jsx("p",{className:"form-subtitle",children:1===e?"Tell us a bit about yourself to get started":"Set a strong password to protect your financial data"})]}),a.general&&(0,r.jsxs)("div",{className:"alert alert-error",children:[(0,r.jsxs)("svg",{className:"alert-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("circle",{cx:"12",cy:"12",r:"10"}),r.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),r.jsx("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]}),r.jsx("span",{children:a.general})]}),(0,r.jsxs)("form",{onSubmit:v,className:"register-form",noValidate:!0,children:[1===e&&(0,r.jsxs)("div",{className:"form-step",children:[(0,r.jsxs)("div",{className:"form-row",children:[(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"firstName",className:"form-label",children:"First Name"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[(0,r.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),r.jsx("circle",{cx:"12",cy:"7",r:"4"})]}),r.jsx("input",{id:"firstName",type:"text",className:`form-input ${a.firstName?"error":""}`,placeholder:"John",value:s.firstName,onChange:e=>j("firstName",e.target.value),autoComplete:"given-name"})]}),a.firstName&&r.jsx("p",{className:"error-message",children:a.firstName})]}),(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"lastName",className:"form-label",children:"Last Name"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[(0,r.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),r.jsx("circle",{cx:"12",cy:"7",r:"4"})]}),r.jsx("input",{id:"lastName",type:"text",className:`form-input ${a.lastName?"error":""}`,placeholder:"Doe",value:s.lastName,onChange:e=>j("lastName",e.target.value),autoComplete:"family-name"})]}),a.lastName&&r.jsx("p",{className:"error-message",children:a.lastName})]})]}),(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"email",className:"form-label",children:"Email Address"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[(0,r.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}),r.jsx("polyline",{points:"22,6 12,13 2,6"})]}),r.jsx("input",{id:"email",type:"email",className:`form-input ${a.email?"error":""}`,placeholder:"you@example.com",value:s.email,onChange:e=>j("email",e.target.value),autoComplete:"email"})]}),a.email&&r.jsx("p",{className:"error-message",children:a.email})]}),(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"phone",className:"form-label",children:"Phone Number"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[r.jsx("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"})}),r.jsx("input",{id:"phone",type:"tel",className:`form-input ${a.phone?"error":""}`,placeholder:"0821234567",value:s.phone,onChange:e=>j("phone",e.target.value),autoComplete:"tel"})]}),a.phone&&r.jsx("p",{className:"error-message",children:a.phone}),r.jsx("p",{className:"helper-text",children:"We'll never share your phone number"})]}),(0,r.jsxs)("button",{type:"button",onClick:()=>{1===e&&f()&&(t(2),window.scrollTo({top:0,behavior:"smooth"}))},className:"btn-submit",children:["Continue",(0,r.jsxs)("svg",{className:"btn-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),r.jsx("polyline",{points:"12 5 19 12 12 19"})]})]})]}),2===e&&(0,r.jsxs)("div",{className:"form-step",children:[(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"password",className:"form-label",children:"Password"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[(0,r.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),r.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),r.jsx("input",{id:"password",type:d?"text":"password",className:`form-input ${a.password?"error":""}`,placeholder:"Create a strong password",value:s.password,onChange:e=>j("password",e.target.value),autoComplete:"new-password"}),r.jsx("button",{type:"button",className:"password-toggle",onClick:()=>p(!d),"aria-label":d?"Hide password":"Show password",children:d?(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),r.jsx("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}):(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),r.jsx("circle",{cx:"12",cy:"12",r:"3"})]})})]}),a.password&&r.jsx("p",{className:"error-message",children:a.password}),s.password&&(0,r.jsxs)("div",{className:"password-strength",children:[(0,r.jsxs)("div",{className:"strength-label",children:["Password strength: ",r.jsx("span",{style:{color:h.color},children:h.label})]}),r.jsx("div",{className:"strength-bars",children:[1,2,3,4].map(e=>r.jsx("div",{className:`strength-bar ${e<=h.score?"active":""}`,style:{backgroundColor:e<=h.score?h.color:"#DFE1E6"}},e))})]})]}),(0,r.jsxs)("div",{className:"form-group",children:[r.jsx("label",{htmlFor:"confirmPassword",className:"form-label",children:"Confirm Password"}),(0,r.jsxs)("div",{className:"input-wrapper",children:[(0,r.jsxs)("svg",{className:"input-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),r.jsx("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),r.jsx("input",{id:"confirmPassword",type:m?"text":"password",className:`form-input ${a.confirmPassword?"error":""}`,placeholder:"Re-enter your password",value:s.confirmPassword,onChange:e=>j("confirmPassword",e.target.value),autoComplete:"new-password"}),r.jsx("button",{type:"button",className:"password-toggle",onClick:()=>x(!m),"aria-label":m?"Hide password":"Show password",children:m?(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),r.jsx("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}):(0,r.jsxs)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),r.jsx("circle",{cx:"12",cy:"12",r:"3"})]})})]}),a.confirmPassword&&r.jsx("p",{className:"error-message",children:a.confirmPassword})]}),(0,r.jsxs)("div",{className:"password-requirements",children:[r.jsx("div",{className:"requirement-title",children:"Password must contain:"}),(0,r.jsxs)("div",{className:"requirements-list",children:[(0,r.jsxs)("div",{className:`requirement-item ${s.password.length>=8?"met":""}`,children:[r.jsx("svg",{className:"requirement-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})}),"At least 8 characters"]}),(0,r.jsxs)("div",{className:`requirement-item ${/[A-Z]/.test(s.password)?"met":""}`,children:[r.jsx("svg",{className:"requirement-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})}),"One uppercase letter"]}),(0,r.jsxs)("div",{className:`requirement-item ${/[a-z]/.test(s.password)?"met":""}`,children:[r.jsx("svg",{className:"requirement-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})}),"One lowercase letter"]}),(0,r.jsxs)("div",{className:`requirement-item ${/[0-9]/.test(s.password)?"met":""}`,children:[r.jsx("svg",{className:"requirement-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})}),"One number"]})]})]}),(0,r.jsxs)("div",{className:"form-options",children:[(0,r.jsxs)("label",{className:"checkbox-label",children:[r.jsx("input",{type:"checkbox",checked:s.acceptTerms,onChange:e=>j("acceptTerms",e.target.checked)}),r.jsx("span",{className:"checkbox-custom"}),(0,r.jsxs)("span",{className:"checkbox-text",children:["I agree to the"," ",r.jsx("a",{href:"/terms",className:"link",target:"_blank",children:"Terms of Service"})," ","and"," ",r.jsx("a",{href:"/privacy",className:"link",target:"_blank",children:"Privacy Policy"})]})]}),a.acceptTerms&&r.jsx("p",{className:"error-message",style:{marginTop:"8px"},children:a.acceptTerms}),(0,r.jsxs)("label",{className:"checkbox-label",style:{marginTop:"12px"},children:[r.jsx("input",{type:"checkbox",checked:s.receiveUpdates,onChange:e=>j("receiveUpdates",e.target.checked)}),r.jsx("span",{className:"checkbox-custom"}),r.jsx("span",{className:"checkbox-text",children:"Send me tips, updates, and special offers"})]})]}),(0,r.jsxs)("div",{className:"form-actions",children:[(0,r.jsxs)("button",{type:"button",onClick:()=>{t(1),n({}),window.scrollTo({top:0,behavior:"smooth"})},className:"btn-back",disabled:l,children:[(0,r.jsxs)("svg",{className:"btn-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[r.jsx("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),r.jsx("polyline",{points:"12 19 5 12 12 5"})]}),"Back"]}),r.jsx("button",{type:"submit",className:"btn-submit",disabled:l,children:l?(0,r.jsxs)(r.Fragment,{children:[r.jsx("svg",{className:"spinner",viewBox:"0 0 24 24",children:r.jsx("circle",{className:"spinner-circle",cx:"12",cy:"12",r:"10",fill:"none",strokeWidth:"3"})}),"Creating account..."]}):(0,r.jsxs)(r.Fragment,{children:["Create Account",r.jsx("svg",{className:"btn-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:r.jsx("polyline",{points:"20 6 9 17 4 12"})})]})})]})]})]}),1===e&&(0,r.jsxs)(r.Fragment,{children:[r.jsx("div",{className:"divider",children:r.jsx("span",{className:"divider-text",children:"or sign up with"})}),(0,r.jsxs)("div",{className:"social-login",children:[(0,r.jsxs)("button",{type:"button",className:"social-btn",onClick:()=>w("google"),children:[(0,r.jsxs)("svg",{className:"social-icon",viewBox:"0 0 24 24",children:[r.jsx("path",{fill:"currentColor",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),r.jsx("path",{fill:"currentColor",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),r.jsx("path",{fill:"currentColor",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),r.jsx("path",{fill:"currentColor",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),"Google"]}),(0,r.jsxs)("button",{type:"button",className:"social-btn",onClick:()=>w("github"),children:[r.jsx("svg",{className:"social-icon",viewBox:"0 0 24 24",fill:"currentColor",children:r.jsx("path",{d:"M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"})}),"GitHub"]})]})]}),(0,r.jsxs)("div",{className:"footer-link",children:["Already have an account?"," ",r.jsx("a",{href:"/login",className:"link",children:"Sign in"})]})]})}),r.jsx("style",{children:`
        /* ============================================
           LAYOUT
           ============================================ */
        .register-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ============================================
           LEFT PANEL
           ============================================ */
        .register-left {
          background: linear-gradient(135deg, #002855 0%, #0052CC 50%, #00875A 100%);
          position: relative;
          overflow: hidden;
          padding: 48px;
          display: flex;
          align-items: center;
        }

        .register-left::before {
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

        .register-left::after {
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

        .register-left-content {
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

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 48px;
        }

        .benefit-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .benefit-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .benefit-icon svg {
          width: 24px;
          height: 24px;
          color: #00E676;
        }

        .benefit-content {
          flex: 1;
        }

        .benefit-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .benefit-description {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.5;
        }

        .testimonial {
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .testimonial-quote {
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 16px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00E676, #0066CC);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .author-name {
          font-size: 14px;
          font-weight: 600;
        }

        .author-title {
          font-size: 13px;
          opacity: 0.7;
        }

        /* ============================================
           RIGHT PANEL
           ============================================ */
        .register-right {
          background: #FAFBFC;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
        }

        .register-form-container {
          width: 100%;
          max-width: 520px;
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ============================================
           PROGRESS INDICATOR
           ============================================ */
        .progress-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
          gap: 16px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #E0E0E0;
          color: #6B778C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #0066CC, #00C853);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        .progress-step.completed .step-number {
          background: #00C853;
          color: white;
        }

        .progress-step.completed .step-number svg {
          width: 24px;
          height: 24px;
        }

        .step-label {
          font-size: 13px;
          font-weight: 600;
          color: #6B778C;
        }

        .progress-step.active .step-label {
          color: #0066CC;
        }

        .progress-line {
          width: 80px;
          height: 2px;
          background: #E0E0E0;
        }

        /* ============================================
           FORM HEADER
           ============================================ */
        .form-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .form-title {
          font-size: 32px;
          font-weight: 800;
          color: #091E42;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6B778C;
          line-height: 1.5;
        }

        /* ============================================
           ALERT
           ============================================ */
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

        /* ============================================
           FORM
           ============================================ */
        .register-form {
          margin-bottom: 32px;
        }

        .form-step {
          animation: fadeIn 0.4s ease-out;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 8px;
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

        .helper-text {
          margin-top: 6px;
          font-size: 13px;
          color: #6B778C;
        }

        /* ============================================
           PASSWORD STRENGTH
           ============================================ */
        .password-strength {
          margin-top: 12px;
        }

        .strength-label {
          font-size: 13px;
          color: #505F79;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .strength-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          height: 4px;
        }

        .strength-bar {
          height: 100%;
          border-radius: 2px;
          background: #DFE1E6;
          transition: background-color 0.3s;
        }

        /* ============================================
           PASSWORD REQUIREMENTS
           ============================================ */
        .password-requirements {
          padding: 16px;
          background: #F4F5F7;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .requirement-title {
          font-size: 13px;
          font-weight: 600;
          color: #091E42;
          margin-bottom: 12px;
        }

        .requirements-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6B778C;
        }

        .requirement-item.met {
          color: #00875A;
        }

        .requirement-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .requirement-item:not(.met) .requirement-icon {
          opacity: 0.3;
        }

        /* ============================================
           CHECKBOX
           ============================================ */
        .form-options {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
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
          margin-top: 2px;
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
          line-height: 1.5;
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

        /* ============================================
           BUTTONS
           ============================================ */
        .form-actions {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
        }

        .btn-back {
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 700;
          font-family: inherit;
          color: #505F79;
          background: white;
          border: 2px solid #DFE1E6;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-back:hover:not(:disabled) {
          border-color: #0052CC;
          color: #0052CC;
        }

        .btn-back:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

        /* ============================================
           DIVIDER
           ============================================ */
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

        /* ============================================
           SOCIAL LOGIN
           ============================================ */
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

        /* ============================================
           FOOTER LINK
           ============================================ */
        .footer-link {
          text-align: center;
          font-size: 15px;
          color: #6B778C;
        }

        /* ============================================
           ANIMATIONS
           ============================================ */
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .register-page {
            grid-template-columns: 1fr;
          }

          .register-left {
            display: none;
          }

          .register-right {
            padding: 32px 24px;
          }

          .requirements-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .register-right {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 28px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .social-login {
            grid-template-columns: 1fr;
          }

          .form-actions {
            grid-template-columns: 1fr;
          }
        }
      `})]})})}},5814:(e,t,s)=>{"use strict";s.r(t),s.d(t,{AuthProvider:()=>a,useAuth:()=>n});var r=s(2295),i=s(3729);let o=(0,i.createContext)(void 0);function a({children:e}){let[t,s]=(0,i.useState)(null),[a,n]=(0,i.useState)(null),[l,c]=(0,i.useState)(!0);(0,i.useEffect)(()=>{c(!1)},[!1]);let d=async(e,t)=>{let r={id:"1",email:e,full_name:"John Doe"},i="mock-jwt-token";return n(i),s(r),{success:!0,data:{access_token:i,user:r}}},p=async e=>{let t={id:"1",email:e.email,full_name:e.full_name||"New User"},r="mock-jwt-token";return n(r),s(t),{success:!0,data:{access_token:r,user:t}}};return r.jsx(o.Provider,{value:{user:t,token:a,isLoading:l,isAuthenticated:!!a&&!!t,login:d,register:p,logout:()=>{n(null),s(null)}},children:e})}let n=()=>{let e=(0,i.useContext)(o);if(!e)throw Error("useAuth must be used within an AuthProvider");return e}},8427:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>o,__esModule:()=>i,default:()=>a});let r=(0,s(6843).createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\app\(auth)\register\page.tsx`),{__esModule:i,$$typeof:o}=r,a=r.default},6313:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d,metadata:()=>c});var r=s(5036);s(5023);var i=s(6843);let o=(0,i.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx`),{__esModule:a,$$typeof:n}=o;o.default;let l=(0,i.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx#AuthProvider`);(0,i.createProxy)(String.raw`C:\Users\tumel\spendwise-sa\frontend\src\contexts\AuthContext.tsx#useAuth`);let c={title:"SpendWise SA",description:"Personal Finance Management"};function d({children:e}){return r.jsx("html",{lang:"en",children:r.jsx("body",{children:r.jsx(l,{children:e})})})}},5023:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[454],()=>s(7827));module.exports=r})();